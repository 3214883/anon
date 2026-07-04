import express from 'express';
import { registerEvent, cancelRegistration, getUserRegistrations, getEventRegistrations, checkIn, getMyTickets, getTicketByNumber } from '../controllers/registrationController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/', authMiddleware, registerEvent);
router.delete('/:registrationId', authMiddleware, cancelRegistration);
router.get('/me', authMiddleware, getUserRegistrations);
router.get('/event/:eventId', authMiddleware, getEventRegistrations);

// Ticket routes
router.get('/tickets/me', authMiddleware, getMyTickets);
router.get('/tickets/:ticketNumber', authMiddleware, getTicketByNumber);

// Protected route for check-in - only event organizers can check in
router.post('/checkin/:ticketId', authMiddleware, checkIn);

export default router;
