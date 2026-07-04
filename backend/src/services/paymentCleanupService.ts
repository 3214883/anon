import { dataSource } from '../config/database';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { Payment } from '../models/Payment';
import { Ticket } from '../models/Ticket';
import { sendNotification } from './notificationService';
import { generateQRCodeBase64 } from '../utils/qrcodeGenerator';
import { v4 as uuidv4 } from 'uuid';

const registrationRepository = dataSource.getRepository(Registration);
const eventRepository = dataSource.getRepository(Event);
const paymentRepository = dataSource.getRepository(Payment);
const ticketRepository = dataSource.getRepository(Ticket);

export const cleanupUnpaidRegistrations = async () => {
  console.log('[定时任务] 开始清理活动前12小时未付款的用户...');
  
  try {
    const now = new Date();
    const events = await eventRepository.find({
      where: { status: 'published' }
    });

    for (const event of events) {
      const eventDate = new Date(event.date);
      const [hours, minutes] = event.startTime.split(':').map(Number);
      eventDate.setHours(hours, minutes || 0, 0, 0);
      
      const timeUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (timeUntilEvent <= 12 && timeUntilEvent > 0) {
        console.log(`[定时任务] 检查活动: ${event.title}, 距离开始: ${timeUntilEvent.toFixed(2)}小时`);
        
        // 查找未付款的报名（只删除未付款的正式报名用户，不删除候补用户）
        const unpaidRegistrations = await registrationRepository.find({
          where: { 
            eventId: event.id,
            isWaitlist: false,
            status: 'pending'
          },
          relations: ['user']
        });
        
        for (const registration of unpaidRegistrations) {
          // 检查是否有对应的支付记录，如果支付记录存在且已完成，则不应删除
          if (registration.paymentId) {
            const payment = await paymentRepository.findOne({
              where: { id: registration.paymentId }
            });
            if (payment && payment.status === 'completed') {
              continue;
            }
          }
          
          // 删除未付款的报名
          await registrationRepository.delete(registration.id);
          
          // 发送通知
          if (registration.user) {
            await sendNotification(
              registration.userId,
              'cancellation',
              '报名已取消',
              `由于未在规定时间内完成支付，您"${event.title}"的报名已被自动取消。`
            );
          }
          
          // 有名额空出，自动从候补队列补充
          await promoteNextFromWaitlist(event.id);
        }
        
        if (unpaidRegistrations.length > 0) {
          console.log(`[定时任务] 已清理 ${unpaidRegistrations.length} 个未付款报名，活动: ${event.title}`);
        }
      }
    }
    
    console.log('[定时任务] 未付款用户清理完成');
  } catch (error) {
    console.error('[定时任务] 清理未付款用户失败:', error);
  }
};

const promoteNextFromWaitlist = async (eventId: number) => {
  try {
    const nextWaitlist = await registrationRepository.findOne({
      where: { eventId, isWaitlist: true, status: 'pending' },
      order: { waitlistPosition: 'ASC' },
      relations: ['user', 'event']
    });

    if (nextWaitlist) {
      nextWaitlist.isWaitlist = false;
      nextWaitlist.waitlistPosition = 0;
      nextWaitlist.status = nextWaitlist.event && nextWaitlist.event.price === 0 ? 'approved' : 'pending';
      
      // 免费活动侯补充正后直接生成电子票
      if (nextWaitlist.event && nextWaitlist.event.price === 0) {
        const ticketNumber = uuidv4();
        nextWaitlist.ticketId = ticketNumber;
        nextWaitlist.ticketStatus = 'valid';
        
        // 创建 Ticket 记录（包含二维码）
        const qrCode = await generateQRCodeBase64(ticketNumber);
        const ticket = ticketRepository.create({
          userId: nextWaitlist.userId,
          eventId: nextWaitlist.eventId,
          registrationId: nextWaitlist.id,
          ticketNumber,
          qrCode,
          status: 'valid',
          ticketType: '免费票(候补转正)'
        });
        await ticketRepository.save(ticket);
        console.log('Ticket created for waitlist promotion with QRCode:', ticket.id);
      } else {
        // 付费活动等待支付后激活
        nextWaitlist.ticketStatus = 'pending';
      }
      
      await registrationRepository.save(nextWaitlist);

      await sendNotification(
        nextWaitlist.userId,
        'registration',
        '候补成功',
        nextWaitlist.event && nextWaitlist.event.price === 0
          ? `由于有用户取消报名，您已从候补状态提升为正式报名！电子票已生效。`
          : `由于有用户取消报名，您已从候补状态提升为正式报名！请在活动开始前48小时内完成支付，付款后电子票自动生效。`
      );

      await registrationRepository
        .createQueryBuilder()
        .update(Registration)
        .set({ waitlistPosition: () => 'waitlistPosition - 1' })
        .where('eventId = :eventId AND isWaitlist = true AND waitlistPosition > 1', { eventId })
        .execute();
    }
  } catch (error) {
    console.error('Error promoting from waitlist:', error);
  }
};

export const startPaymentCleanupService = () => {
  setInterval(async () => {
    await cleanupUnpaidRegistrations();
  }, 60 * 60 * 1000);
  
  cleanupUnpaidRegistrations();
  console.log('[定时任务] 未付款清理服务已启动');
};
