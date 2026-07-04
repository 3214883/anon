import { Router } from 'express';
import { createPayment, handlePaymentCallback, getUserPayments, getPaymentDetails, createAlipayPayment, simulateAlipaySuccess, getAlipayOrderStatus, handleAlipayNotify, createAlipayWebPayment, createWalletPayment } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/alipay/notify', handleAlipayNotify);

router.use(authMiddleware);

router.post('/create', createPayment);
router.post('/wallet/pay', createWalletPayment);
router.post('/callback', handlePaymentCallback);
router.get('/history', getUserPayments);
router.get('/:paymentId', getPaymentDetails);

router.post('/alipay/create', createAlipayPayment);
router.post('/alipay/create-web', createAlipayWebPayment);
router.post('/alipay/simulate-success', simulateAlipaySuccess);
router.get('/alipay/status/:orderId', getAlipayOrderStatus);

export default router;
