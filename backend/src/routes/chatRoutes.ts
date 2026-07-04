import express from 'express';
import { getEventMessages, sendMessage, deleteMessage } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.get('/event/:eventId', authMiddleware, getEventMessages);
router.post('/event/:eventId', authMiddleware, sendMessage);
router.delete('/:messageId', authMiddleware, deleteMessage);

export default router;
