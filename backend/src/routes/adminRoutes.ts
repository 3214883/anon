import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { 
  getUsers, getUserById, createUser, updateUser, deleteUser, batchDeleteUsers,
  getEvents, getEventById, updateEvent, deleteEvent
} from '../controllers/adminController';

const router = express.Router();

// 应用认证和管理员权限中间件
router.use(authMiddleware);
router.use(adminMiddleware);

// 用户管理路由
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.delete('/users/batch', batchDeleteUsers);

// 活动管理路由
router.get('/events', getEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

export default router;