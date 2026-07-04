import { dataSource } from '../config/database';
import { Ticket } from '../models/Ticket';

const showTickets = async () => {
  console.log('========================================');
  console.log('📋 电子票表 (Ticket) 结构 & 数据');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    const ticketRepository = dataSource.getRepository(Ticket);

    // 查询所有数据
    const tickets = await ticketRepository.find({
      relations: ['event', 'registration'],
      order: { id: 'ASC' }
    });

    console.log(`📊 电子票表总记录数: ${tickets.length} 条\n`);

    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log('ID | 用户ID | 活动ID | 报名ID | 票号(前16位)        | 状态    | 票类型');
    console.log('─────────────────────────────────────────────────────────────────────────────');

    tickets.forEach(t => {
      const shortTicket = t.ticketNumber.substring(0, 16).padEnd(18);
      const status = t.status.padEnd(6);
      const type = (t.ticketType || '普通票').padEnd(10);
      console.log(`${String(t.id).padEnd(2)} | ${String(t.userId).padEnd(6)} | ${String(t.eventId).padEnd(6)} | ${String(t.registrationId).padEnd(6)} | ${shortTicket} | ${status} | ${type}`);
    });

    console.log('─────────────────────────────────────────────────────────────────────────────\n');

    // 统计
    const stats = {
      valid: tickets.filter(t => t.status === 'valid').length,
      checkedIn: tickets.filter(t => t.status === 'checked-in').length,
      free: tickets.filter(t => t.ticketType?.includes('免费')).length,
      paid: tickets.filter(t => t.ticketType?.includes('付费')).length
    };

    console.log('📈 统计:');
    console.log(`   ✅ 有效票: ${stats.valid} 张`);
    console.log(`   ✅ 已签到: ${stats.checkedIn} 张`);
    console.log(`   🆓 免费票: ${stats.free} 张`);
    console.log(`   💰 付费票: ${stats.paid} 张`);

    await dataSource.destroy();

  } catch (error: any) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
};

showTickets();
