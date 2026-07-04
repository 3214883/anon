import { dataSource } from '../config/database';
import { Ticket } from '../models/Ticket';

const showTicketDetails = async () => {
  console.log('\n');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('                    🎫 电子票完整详细信息');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('\n');

  try {
    await dataSource.initialize();

    const ticketRepository = dataSource.getRepository(Ticket);

    const tickets = await ticketRepository.find({
      relations: ['event', 'registration', 'user'],
      order: { id: 'ASC' }
    });

    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      
      console.log(`────────────────────────────────────────────────────────────`);
      console.log(`  【电子票 #${t.id}】`);
      console.log(`────────────────────────────────────────────────────────────`);
      console.log(`  🎫 票号:       ${t.ticketNumber}`);
      console.log(`  📊 状态:       ${t.status}`);
      console.log(`  🎟️  票类型:    ${t.ticketType || '普通票'}`);
      console.log(`  👤 用户ID:     ${t.userId}`);
      console.log(`     用户名:     ${t.user?.username || '未关联'}`);
      console.log(`  📅 活动ID:     ${t.eventId}`);
      console.log(`     活动名:     ${t.event?.title || '已删除'}`);
      console.log(`     活动价格:   ${t.event?.price === 0 ? '免费' : '¥' + t.event?.price}`);
      console.log(`  📝 报名ID:     ${t.registrationId}`);
      console.log(`     联系人:     ${t.registration?.contactName || '-'}`);
      console.log(`     手机号:     ${t.registration?.contactPhone || '-'}`);
      console.log(`     报名状态:   ${t.registration?.ticketStatus || '-'}`);
      console.log(`     是否签到:   ${t.registration?.checkInTime ? '是 ' + t.registration.checkInTime : '否'}`);
      console.log(`  ⏰ 创建时间:   ${t.createdAt.toLocaleString('zh-CN')}`);
      console.log(`  ✏️  更新时间:   ${t.updatedAt.toLocaleString('zh-CN')}`);
      console.log('');
    }

    console.log('══════════════════════════════════════════════════════════════════');
    console.log(`                         总计: ${tickets.length} 张电子票`);
    console.log('══════════════════════════════════════════════════════════════════\n');

    await dataSource.destroy();

  } catch (error: any) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
};

showTicketDetails();
