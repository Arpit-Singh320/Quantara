/**
 * Authentication Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/index.js';
import { createError } from '../middleware/error.middleware.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  company: z.string().optional(),
});

// In-memory user store (replace with database in production)
const users: Map<string, { id: string; email: string; password: string; name: string; company?: string }> = new Map();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    if (users.has(data.email)) {
      throw createError('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const userId = `user_${Date.now()}`;

    users.set(data.email, {
      id: userId,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      company: data.company,
    });

    const token = jwt.sign(
      { id: userId, email: data.email },
      config.jwtSecret
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email: data.email,
        name: data.name,
        company: data.company,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = users.get(data.email);
    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = Array.from(users.values()).find(u => u.id === req.user?.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  // In a real app, you might invalidate the token here
  res.json({ message: 'Logged out successfully' });
});

export default router;
