import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    departmentId: user.departmentId,
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
  departmentId: z.string().uuid().optional(),
  semester: z.number().int().optional(),
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
        departmentId: body.departmentId ?? null,
        semester: body.semester ?? null,
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

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

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
  departmentId: z.string().uuid().nullable().optional(),
  semester: z.number().int().min(1).max(12).nullable().optional(),
});

authRouter.put('/profile', requireAuth, async (req: any, res) => {
  try {
    const body = profileSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.userId }, data: body });
    return res.json(getUserPublic(user));
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /forgot-password (stub)
const forgotSchema = z.object({ email: z.string().email() });
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const body = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    // In MVP, do not reveal existence
    // TODO: integrate email service to send token
    return res.status(204).send();
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /reset-password (stub)
const resetSchema = z.object({ token: z.string().min(10), newPassword: z.string().min(8) });
authRouter.post('/reset-password', async (req, res) => {
  try {
    const _body = resetSchema.parse(req.body);
    // TODO: validate token stored server-side, update passwordHash
    return res.status(204).send();
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
