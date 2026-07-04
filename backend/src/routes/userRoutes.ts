import express from 'express';
import { register, login, getUserInfo, updateUserInfo, sendCode, loginWithPhone, refreshToken, getUserInfoById, changePassword } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-code', sendCode);
router.post('/login/phone', loginWithPhone);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', authMiddleware, getUserInfo);
router.put('/me', authMiddleware, updateUserInfo);
router.post('/change-password', authMiddleware, changePassword);

// Public route to get user info by id
router.get('/:id', getUserInfoById);

export default router;
