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
const ACCESS_TOKEN_TTL_SEC = parseInt(process.env.ACCESS_TOKEN_TTL_SEC || '900'); // 15m
const REFRESH_TOKEN_TTL_SEC = parseInt(process.env.REFRESH_TOKEN_TTL_SEC || '1209600'); // 14d
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
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    semester: user.semester,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    subscription: {
      type: 'free',
      isActive: false,
      expiresAt: null,
    },
    profile: {
      avatar: user.avatarUrl ?? undefined,
      department: undefined,
      year: user.semester ?? undefined,
    },
    firstName: user.name?.split(' ')[0] || user.name,
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
  };
}

// Auth middleware
export function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
  if (!token) return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No token' } });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    return next();
  } catch (_e) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
}

// Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  semester: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        semester: body.semester ?? 'S1',
      },
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({ user: getUserPublic(user) });
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
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });

    // Update last login time (removed lastLoginAt field)

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ user: getUserPublic(user) });
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
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Invalid refresh' } });
    const newAccess = signAccessToken({ sub: user.id, role: user.role });
    const newRefresh = signRefreshToken({ sub: user.id });
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
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    return res.json({ user: getUserPublic(user), valid: true });
  } catch (e) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
});

// POST /logout
authRouter.post('/logout', async (_req, res) => {
  clearAuthCookies(res);
  return res.status(204).send();
});

// GET /me (also exported for mounting at /api/me)
authRouter.get('/me', requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  return res.json({ user: getUserPublic(user) });
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
