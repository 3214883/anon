import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  applySettlement,
  getMySettlements,
  getAllSettlements,
  approveSettlement,
  rejectSettlement,
  getSettlementSummary
} from '../controllers/settlementController';

const router = express.Router();

router.post('/apply', authMiddleware, applySettlement);
router.get('/my', authMiddleware, getMySettlements);
router.get('/summary', authMiddleware, getSettlementSummary);
router.get('/all', authMiddleware, getAllSettlements);
router.post('/:settlementId/approve', authMiddleware, approveSettlement);
router.post('/:settlementId/reject', authMiddleware, rejectSettlement);

export default router;
