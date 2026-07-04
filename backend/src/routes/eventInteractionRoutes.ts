import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  toggleLike,
  checkLikeStatus,
  toggleFavorite,
  checkFavoriteStatus,
  createComment,
  getEventComments,
  submitRating,
  checkRatingStatus,
  likeComment
} from '../controllers/eventInteractionController';

const router = express.Router();

// 点赞
router.post('/events/:eventId/like', authMiddleware, toggleLike);
router.get('/events/:eventId/like-status', authMiddleware, checkLikeStatus);

// 收藏
router.post('/events/:eventId/favorite', authMiddleware, toggleFavorite);
router.get('/events/:eventId/favorite-status', authMiddleware, checkFavoriteStatus);

// 评论
router.post('/events/:eventId/comments', authMiddleware, createComment);
router.get('/events/:eventId/comments', getEventComments);
router.post('/comments/:commentId/like', authMiddleware, likeComment);

// 评分
router.post('/events/:eventId/rating', authMiddleware, submitRating);
router.get('/events/:eventId/rating-status', authMiddleware, checkRatingStatus);

export default router;
