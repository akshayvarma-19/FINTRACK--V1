import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userStore, AccountType } from '../models/userStore.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

function getJwtSecret(): string {
  return process.env.JWT_SECRET_KEY || 'fintrack_default_jwt_secret_dev';
}

function getJwtExpiresIn(): any {
  return process.env.ACCESS_TOKEN_EXPIRE_MINUTES
    ? `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m`
    : '60m';
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, accountType } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Validate email
    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required'
      });
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters'
      });
    }

    // Validate accountType
    const normalizedAccountType = (accountType || 'individual').toString().toLowerCase() as AccountType;
    if (normalizedAccountType !== 'individual' && normalizedAccountType !== 'corporate') {
      return res.status(400).json({
        success: false,
        message: 'accountType must be either "individual" or "corporate"'
      });
    }

    // Check duplicate email
    const existingUser = await userStore.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await userStore.create({
      name,
      email,
      passwordHash,
      accountType: normalizedAccountType
    });

    const userResponse = userStore.toUserResponse(newUser);

    // Sign JWT
    const token = jwt.sign(
      {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        accountType: userResponse.accountType
      },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userResponse,
      token
    });
  } catch (error: any) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await userStore.findByEmail(email);
    if (!user) {
      // Do not reveal whether email exists
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userResponse = userStore.toUserResponse(user);

    const token = jwt.sign(
      {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        accountType: userResponse.accountType
      },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error: any) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await userStore.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: userStore.toUserResponse(user)
    });
  } catch (error: any) {
    console.error('[Auth/Me Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
