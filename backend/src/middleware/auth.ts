import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserResponse } from '../models/userStore.js';

export interface AuthenticatedRequest extends Request {
  user?: UserResponse;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is missing'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Authorization header must be Bearer token'
    });
  }

  const token = parts[1];
  const secretKey = process.env.JWT_SECRET_KEY || 'fintrack_default_jwt_secret_dev';

  try {
    const decoded = jwt.verify(token, secretKey) as UserResponse;
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
}
