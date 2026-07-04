import express from 'express';
import { getSystemOverview, getEventCategoryStats, getRecentEventsStats } from '../controllers/statsController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = express.Router();

// Admin-only routes
router.get('/overview', authMiddleware, adminMiddleware, getSystemOverview);
router.get('/event-categories', authMiddleware, adminMiddleware, getEventCategoryStats);
router.get('/recent-events', authMiddleware, adminMiddleware, getRecentEventsStats);

export default router;