import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { emailService } from '../services/email.service';
import crypto from 'crypto';

const prisma = new PrismaClient();
export const authRouter = Router();

// Helpers
const ACCESS_TOKEN_TTL_SEC = parseInt(process.env.ACCESS_TOKEN_TTL_SEC || '604800'); // 7 days
const REFRESH_TOKEN_TTL_SEC = parseInt(process.env.REFRESH_TOKEN_TTL_SEC || '2592000'); // 30 days
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'changeme-refresh';

function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SEC });
}
function signRefreshToken(payload: object) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SEC });
}

function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_TTL_SEC * 1000,
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_TTL_SEC * 1000,
    path: '/',
  });
}

function clearAuthCookies(res: any) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
  res.clearCookie('refresh_token', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
}

function getUserPublic(user: any) {
  // Extract active subscription data if available
  let subscriptionData: any = null;

  if (user.subscriptions && user.subscriptions.length > 0) {
    const activeSub = user.subscriptions[0]; // First active subscription
    subscriptionData = {
      type: activeSub.plan?.type || activeSub.type,
      isActive: activeSub.status === 'ACTIVE',
      expiresAt: activeSub.expiresAt,
    };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    semester: user.semester,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    subscription: subscriptionData,
    profile: {
      avatar: user.avatarUrl ?? undefined,
      department: undefined,
      year: user.semester ?? undefined,
    },
    firstName: user.name?.split(' ')[0] || user.name,
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
  };
}

// Auth middleware - vérifie le JWT token ET la session active
export async function requireAuth(req: any, res: any, next: any) {
  const cookieToken = req.cookies?.access_token;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.split(' ')[1];
  const token = cookieToken || headerToken || '';

  console.log('[requireAuth]', req.url, {
    hasCookieToken: !!cookieToken,
    hasAuthHeader: !!authHeader,
    hasHeaderToken: !!headerToken,
    tokenSource: cookieToken ? 'cookie' : headerToken ? 'header' : 'none',
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
  });

  if (!token) {
    console.log('[requireAuth] No token found, returning 401');
    return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No token' } });
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Vérifier que ce token est toujours le token actif (session unique)
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true, activeToken: true, activeDeviceId: true }
    });

    if (!user) {
      console.log('[requireAuth] User not found');
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    if (user.activeToken !== token) {
      console.log('[requireAuth] Session expired - logged in from another device:', {
        userId: user.id,
        activeDevice: user.activeDeviceId
      });
      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Votre session a expiré. Vous vous êtes connecté depuis un autre appareil.'
        }
      });
    }

    req.userId = decoded.sub;
    req.userRole = decoded.role;
    console.log('[requireAuth] Token verified and session active:', { userId: decoded.sub, role: decoded.role });
    return next();
  } catch (_e: any) {
    console.log('[requireAuth] Token verification failed:', _e.message);
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
}

// Admin check middleware - must be used after requireAuth
export function requireAdmin(req: any, res: any, next: any) {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
    console.log('[requireAdmin] Access denied for role:', req.userRole);
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  console.log('[requireAdmin] Admin access granted:', req.userRole);
  return next();
}

// Optional auth middleware - does not block if no token
export function optionalAuth(req: any, res: any, next: any) {
  const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
  if (!token) {
    req.userId = null;
    req.userRole = null;
    return next();
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    return next();
  } catch (_e) {
    req.userId = null;
    req.userRole = null;
    return next();
  }
}

// Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  semester: z.enum(['PCEM1', 'PCEM2']),
  deviceId: z.string().min(1), // ID de l'appareil pour lier le compte
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceId: z.string().min(1), // ID de l'appareil pour vérifier l'autorisation
});

// POST /register
authRouter.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email already in use' } });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    let user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        semester: body.semester,
        authorizedDevices: [body.deviceId], // Premier appareil autorisé
        activeDeviceId: body.deviceId,
      },
    });

    // Fetch user with subscription data
    user = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      }
    }) as any;

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    // Stocker le token actif pour la session unique
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activeToken: accessToken,
        activeDeviceId: body.deviceId
      }
    });

    setAuthCookies(res, accessToken, refreshToken);

    console.log('[Auth] Registration successful:', {
      userId: user.id,
      email: user.email,
      deviceId: body.deviceId,
      authorizedDevices: [body.deviceId]
    });

    return res.status(201).json({
      user: getUserPublic(user),
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /login
authRouter.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      }
    });
    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });

    // Vérifier si l'appareil est dans la liste des appareils autorisés
    const authorizedDevices = user.authorizedDevices || [];
    const isAuthorizedDevice = authorizedDevices.includes(body.deviceId);

    if (!isAuthorizedDevice) {
      // L'appareil n'est pas autorisé
      if (authorizedDevices.length >= 2) {
        // Maximum 2 appareils déjà enregistrés
        console.log('[Auth] Login denied - Max devices reached:', {
          userId: user.id,
          email: user.email,
          authorizedDevices,
          attemptedDevice: body.deviceId
        });
        return res.status(403).json({
          error: {
            code: 'MAX_DEVICES_REACHED',
            message: 'Nombre maximum d\'appareils atteint (2 max: PC et téléphone). Contactez le support pour changer d\'appareil.'
          }
        });
      }

      // Ajouter ce nouvel appareil (2e appareil)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          authorizedDevices: {
            push: body.deviceId
          }
        }
      });
      console.log('[Auth] New device authorized:', {
        userId: user.id,
        deviceId: body.deviceId,
        totalDevices: authorizedDevices.length + 1
      });
    }

    // Vérifier si une session est déjà active
    if (user.activeToken) {
      console.log('[Auth] Active session detected - will be invalidated:', {
        userId: user.id,
        activeDevice: user.activeDeviceId,
        newDevice: body.deviceId
      });
    }

    // Generate new tokens
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    // Mettre à jour la session active (invalide l'ancienne session)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activeToken: accessToken,
        activeDeviceId: body.deviceId
      }
    });

    setAuthCookies(res, accessToken, refreshToken);

    console.log('[Auth] Login successful:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId: body.deviceId,
      authorizedDevices: isAuthorizedDevice ? authorizedDevices : [...authorizedDevices, body.deviceId]
    });

    return res.json({
      user: getUserPublic(user),
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /refresh
authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: { code: 'NO_REFRESH', message: 'No refresh token' } });
  try {
    const decoded: any = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      }
    });
    if (!user) return res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Invalid refresh' } });

    const newAccess = signAccessToken({ sub: user.id, role: user.role });
    const newRefresh = signRefreshToken({ sub: user.id });

    // Mettre à jour le token actif
    await prisma.user.update({
      where: { id: user.id },
      data: { activeToken: newAccess }
    });

    setAuthCookies(res, newAccess, newRefresh);
    return res.json({ user: getUserPublic(user) });
  } catch (e) {
    clearAuthCookies(res);
    return res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Invalid refresh' } });
  }
});

// GET /me - Get current user info
authRouter.get('/me', requireAuth, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    return res.json({ user: getUserPublic(user) });
  } catch (err: any) {
    console.error('Error in /me:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /verify
authRouter.get('/verify', async (req, res) => {
  const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
  if (!token) return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No token' } });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      }
    });
    if (!user) return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    return res.json({ user: getUserPublic(user), valid: true });
  } catch (e) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
});

// POST /logout
authRouter.post('/logout', async (req: any, res) => {
  try {
    const cookieToken = req.cookies?.access_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.split(' ')[1];
    const token = cookieToken || headerToken;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        // Effacer la session active
        await prisma.user.update({
          where: { id: decoded.sub },
          data: {
            activeToken: null,
            activeDeviceId: null
          }
        });
        console.log('[Auth] Logout - session cleared for user:', decoded.sub);
      } catch (e) {
        console.log('[Auth] Logout - Token invalid, clearing cookies only');
      }
    }

    clearAuthCookies(res);
    return res.status(204).send();
  } catch (e) {
    clearAuthCookies(res);
    return res.status(204).send();
  }
});

// PUT /profile
const profileSchema = z.object({
  name: z.string().min(1).optional(),
  semester: z.string().nullable().optional(),
});

authRouter.put('/profile', requireAuth, async (req: any, res) => {
  try {
    const body = profileSchema.parse(req.body);
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.semester !== undefined) updateData.semester = body.semester;
    
    const user = await prisma.user.update({ where: { id: req.userId }, data: updateData });
    return res.json(getUserPublic(user));
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /forgot-password
const forgotSchema = z.object({ email: z.string().email() });
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const body = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    // Always respond with 204 to avoid revealing user existence
    if (!user) {
      return res.status(204).send();
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't reveal email failure to user
    }

    return res.status(204).send();
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /verify-reset-code
const verifyCodeSchema = z.object({ 
  email: z.string().email(),
  code: z.string().min(6)
});
authRouter.post('/verify-reset-code', async (req, res) => {
  try {
    const body = verifyCodeSchema.parse(req.body);
    
    // Find the user
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return res.status(400).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    // Find valid token for this user
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { 
        userId: user.id,
        token: body.code,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      return res.status(400).json({ error: { code: 'INVALID_CODE', message: 'Invalid or expired code' } });
    }

    return res.json({ message: 'Code verified successfully', token: tokenRecord.token });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /reset-password
const resetSchema = z.object({ token: z.string().min(10), newPassword: z.string().min(8) });
authRouter.post('/reset-password', async (req, res) => {
  try {
    const body = resetSchema.parse(req.body);

    // Find valid token
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(body.newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash }
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: tokenRecord.id }
    });

    // Clean up old tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: tokenRecord.userId,
        id: { not: tokenRecord.id },
        expiresAt: { lt: new Date() }
      }
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
