import { dataSource } from '../config/database';
import { Event } from '../models/Event';
import { Payment } from '../models/Payment';
import { Settlement } from '../models/Settlement';

const eventRepository = dataSource.getRepository(Event);
const paymentRepository = dataSource.getRepository(Payment);
const settlementRepository = dataSource.getRepository(Settlement);

const PLATFORM_FEE_RATE = 0.05;

const createSettlementForEvent = async (event: Event) => {
  try {
    // 检查是否已经有结算申请
    const existingSettlement = await settlementRepository.findOne({
      where: { eventId: event.id }
    });

    if (existingSettlement) {
      console.log(`[结算任务] 活动 ${event.title} 已有结算申请，跳过`);
      return;
    }

    // 获取该活动的所有已完成支付记录（支持多种成功状态）
    const payments = await paymentRepository.createQueryBuilder('payment')
      .where('payment.eventId = :eventId', { eventId: event.id })
      .andWhere('payment.status IN (:...statuses)', { statuses: ['completed', 'paid', 'success'] })
      .getMany();

    if (payments.length === 0) {
      console.log(`[结算任务] 活动 ${event.title} 没有已完成的支付，跳过`);
      return;
    }

    // 计算结算金额
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const participantCount = payments.length;
    const feeAmount = totalAmount * PLATFORM_FEE_RATE;
    const settleAmount = totalAmount - feeAmount;

    // 创建结算申请
    const settlement = settlementRepository.create({
      eventId: event.id,
      organizerId: event.organizerId,
      totalAmount,
      participantCount,
      feeAmount,
      settleAmount,
      status: 'pending'
    });

    await settlementRepository.save(settlement);
    console.log(`[结算任务] ✅ 活动 ${event.title} 自动创建结算申请，金额: ¥${settleAmount.toFixed(2)}`);

  } catch (error) {
    console.error(`[结算任务] ❌ 活动 ${event.title} 创建结算申请失败:`, error);
  }
};

const checkEndedEventsAndSettle = async () => {
  console.log('[结算任务] 开始检查已结束的活动...');

  try {
    const now = new Date();

    // 查找所有已发布且已结束的活动
    const events = await eventRepository.find({
      where: { status: 'published' }
    });

    for (const event of events) {
      const eventDate = new Date(event.date);
      const [hours, minutes] = event.endTime?.split(':').map(Number) || [23, 59];
      eventDate.setHours(hours, minutes || 0, 0, 0);

      // 活动已结束（结束时间早于当前时间）
      if (eventDate < now) {
        console.log(`[结算任务] 发现已结束活动: ${event.title}`);
        await createSettlementForEvent(event);
      }
    }

    console.log('[结算任务] 已结束活动检查完成');
  } catch (error) {
    console.error('[结算任务] 检查已结束活动失败:', error);
  }
};

export const startSettlementTask = () => {
  // 立即执行一次
  checkEndedEventsAndSettle();

  // 每小时执行一次
  setInterval(checkEndedEventsAndSettle, 60 * 60 * 1000);
  console.log('[结算任务] 自动结算服务已启动');
};
