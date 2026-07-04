import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import userRoutes from './routes/userRoutes';
import eventRoutes from './routes/eventRoutes';
import registrationRoutes from './routes/registrationRoutes';
import socialRoutes from './routes/socialRoutes';
import chatRoutes from './routes/chatRoutes';
import paymentRoutes from './routes/paymentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import statsRoutes from './routes/statsRoutes';
import userCenterRoutes from './routes/userCenterRoutes';
import eventInteractionRoutes from './routes/eventInteractionRoutes';
import settlementRoutes from './routes/settlementRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import walletRoutes from './routes/walletRoutes';
import adminRoutes from './routes/adminRoutes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use((req, res, next) => {
  console.log('🌐 请求:', req.method, req.url);
  next();
});
app.use(express.json({ limit: '50mb' })); // 支持大的base64图片
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/user-center', userCenterRoutes);
app.use('/api/interaction', eventInteractionRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// 添加调试中间件
app.use('/api/payments', (req, res, next) => {
  console.log('=== Payments route middleware called ===');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request headers:', req.headers);
  next();
}, paymentRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Initialize database connection and start server
const PORT = process.env.PORT || 3000;
initDatabase()
  .then(() => {
    console.log('SQLite database connected successfully');
    
    import('./utils/checkPendingPayments').then(({ startPaymentCheckTask }) => {
      startPaymentCheckTask();
    });
    import('./services/paymentCleanupService').then(({ startPaymentCleanupService }) => {
      startPaymentCleanupService();
    });
    import('./services/settlementService').then(({ startSettlementTask }) => {
      startSettlementTask();
    });
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
  });

export default app;