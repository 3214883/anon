import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getWalletBalance, getTransactions, recharge } from '../controllers/walletController';

const router = Router();

// 所有钱包接口都需要认证
router.use(authMiddleware);

// 获取钱包余额
router.get('/balance', getWalletBalance);

// 获取交易记录
router.get('/transactions', getTransactions);

// 钱包充值
router.post('/recharge', recharge);

export default router;