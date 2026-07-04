import { dataSource } from '../config/database';
import { Payment } from '../models/Payment';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { LessThan } from 'typeorm';

const paymentRepository = dataSource.getRepository(Payment);
const registrationRepository = dataSource.getRepository(Registration);
const eventRepository = dataSource.getRepository(Event);

// 检查并取消超时的待支付订单
export const checkPendingPayments = async () => {
  try {
    console.log('Checking pending payments...');
    
    // 获取30分钟前的时间
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    // 查找超时的待支付订单
    const pendingPayments = await paymentRepository.find({
      where: {
        status: 'pending',
        createdAt: LessThan(thirtyMinutesAgo)
      },
      relations: ['registration', 'event']
    });
    
    console.log(`Found ${pendingPayments.length} pending payments to check`);
    
    for (const payment of pendingPayments) {
      try {
        // 开始事务
        await dataSource.transaction(async (transactionalEntityManager) => {
          // 1. 更新支付状态为cancelled
          payment.status = 'cancelled';
          await transactionalEntityManager.save(payment);
          
          // 2. 更新报名状态为cancelled
          if (payment.registration) {
            payment.registration.status = 'cancelled';
            await transactionalEntityManager.save(payment.registration);
            
            // 3. 释放活动名额
            if (payment.event) {
              payment.event.registeredCount = Math.max(0, payment.event.registeredCount - 1);
              await transactionalEntityManager.save(payment.event);
            }
          }
          
          console.log(`Cancelled payment ${payment.id} and related registration`);
        });
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
      }
    }
    
    console.log('Pending payments check completed');
  } catch (error) {
    console.error('Error checking pending payments:', error);
  }
};

// 启动定时任务
export const startPaymentCheckTask = () => {
  // 立即执行一次
  checkPendingPayments();
  
  // 每5分钟执行一次
  setInterval(checkPendingPayments, 5 * 60 * 1000);
  console.log('Payment check task started');
};