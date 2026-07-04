import express from 'express';
import { addFavorite, removeFavorite, getUserFavorites, checkFavorite } from '../controllers/favoriteController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/', authMiddleware, addFavorite);
router.delete('/:eventId', authMiddleware, removeFavorite);
router.get('/', authMiddleware, getUserFavorites);
router.get('/check/:eventId', authMiddleware, checkFavorite);

export default router;