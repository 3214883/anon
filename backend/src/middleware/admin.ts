import { Request, Response, NextFunction } from 'express';
import { dataSource } from '../config/database';
import { User } from '../models/User';

const userRepository = dataSource.getRepository(User);

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const user = await userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin permission required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};