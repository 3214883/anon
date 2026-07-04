import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getMyLikes,
  getMyFavorites,
  getMyComments,
  getMyRatings,
  getUserStats
} from '../controllers/userCenterController';

const router = express.Router();

router.get('/likes', authMiddleware, getMyLikes);
router.get('/favorites', authMiddleware, getMyFavorites);
router.get('/comments', authMiddleware, getMyComments);
router.get('/ratings', authMiddleware, getMyRatings);
router.get('/stats', authMiddleware, getUserStats);

export default router;
