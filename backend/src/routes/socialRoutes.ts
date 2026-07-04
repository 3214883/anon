import express from 'express';
import { likeEvent, favoriteEvent, addComment, getComments, deleteComment, sendFriendRequest, acceptFriendRequest, getFriends } from '../controllers/socialController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/like', authMiddleware, likeEvent);
router.post('/favorite', authMiddleware, favoriteEvent);
router.post('/comment', authMiddleware, addComment);
router.get('/comments/:eventId', getComments);
router.delete('/comment/:commentId', authMiddleware, deleteComment);
router.post('/friend/request', authMiddleware, sendFriendRequest);
router.put('/friend/request/:requestId/accept', authMiddleware, acceptFriendRequest);
router.get('/friends', authMiddleware, getFriends);

export default router;
