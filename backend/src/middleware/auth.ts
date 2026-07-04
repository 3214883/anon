import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth middleware called for:', req.method, req.url);
  
  const token = req.headers?.authorization?.replace('Bearer ', '');
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ 
      success: false, 
      message: '请先登录',
      code: 'NO_TOKEN'
    });
  }
  
  console.log('Token received:', token.substring(0, 30) + '...');
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    console.log('Invalid or expired token');
    return res.status(401).json({ 
      success: false, 
      message: '用户信息无效，请重新登录',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  console.log('Token valid, userId:', decoded.userId);
  (req as any).userId = decoded.userId;
  next();
};
