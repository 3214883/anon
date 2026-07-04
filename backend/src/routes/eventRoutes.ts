import express from 'express';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, searchEvents, getPendingEvents, approveEvent, rejectEvent, getParticipants, getOrganizerEvents, getCategories, getUpcomingEvents } from '../controllers/eventController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/categories', getCategories);
router.get('/upcoming', getUpcomingEvents);
router.get('/search', searchEvents);
router.get('/organizer/:organizerId', getOrganizerEvents);
router.get('/:id', getEvent);

// Protected routes
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);
router.get('/:id/participants', authMiddleware, getParticipants);

// Admin routes
router.get('/admin/pending', authMiddleware, adminMiddleware, getPendingEvents);
router.put('/admin/approve/:id', authMiddleware, adminMiddleware, approveEvent);
router.put('/admin/reject/:id', authMiddleware, adminMiddleware, rejectEvent);

export default router;
