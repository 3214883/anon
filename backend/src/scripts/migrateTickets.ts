import { dataSource } from '../config/database';
import { Registration } from '../models/Registration';
import { Ticket } from '../models/Ticket';
import { v4 as uuidv4 } from 'uuid';

/**
 * 历史数据迁移脚本
 * 将 Registration 表中已有的有效报名批量迁入 Ticket 表
 */

const migrateTickets = async () => {
  console.log('========================================');
  console.log('开始迁移历史电子票数据...');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    const registrationRepository = dataSource.getRepository(Registration);
    const ticketRepository = dataSource.getRepository(Ticket);

    // 1. 查询所有已有的报名记录
    const registrations = await registrationRepository.find({
      where: {},
      relations: ['event', 'user'],
      order: { createdAt: 'ASC' }
    });

    console.log(`📊 共找到 ${registrations.length} 条报名记录\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 2. 逐条迁移
    for (const registration of registrations) {
      try {
        // 检查是否已经迁移过
        const existingTicket = await ticketRepository.findOne({
          where: { registrationId: registration.id }
        });

        if (existingTicket) {
          console.log(`⏭️  跳过 ID=${registration.id}: 已迁移过`);
          skipCount++;
          continue;
        }

        // 没有票号的，自动生成一个
        if (!registration.ticketId) {
          registration.ticketId = uuidv4();
          console.log(`ℹ️  自动生成票号 ID=${registration.id}`);
        }

        // 确定票类型
        let ticketType = '普通票';
        if (registration.event) {
          if (registration.event.price === 0) {
            ticketType = registration.isWaitlist ? '免费票(候补转正)' : '免费票';
          } else {
            ticketType = registration.isWaitlist ? '付费票(候补转正)' : '付费票';
          }
        }

        // 确定状态
        let status = registration.ticketStatus || 'pending';
        if (registration.checkInTime) {
          status = 'checked-in';
        }

        // 创建 Ticket 记录
        const ticket = ticketRepository.create({
          userId: registration.userId,
          eventId: registration.eventId,
          registrationId: registration.id,
          ticketNumber: registration.ticketId,
          status,
          ticketType
        });

        await ticketRepository.save(ticket);

        console.log(`✅ 迁移成功 ID=${registration.id}: ${ticketType} (${status})`);
        successCount++;

      } catch (error: any) {
        console.log(`❌ 迁移失败 ID=${registration.id}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('迁移完成！统计：');
    console.log(`✅ 成功迁移: ${successCount} 条`);
    console.log(`⏭️  跳过: ${skipCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    console.log('========================================');

    // 验证迁移结果
    const totalTickets = await ticketRepository.count();
    console.log(`\n📊 Ticket表现有记录: ${totalTickets} 条`);

    await dataSource.destroy();
    console.log('\n👋 数据库连接已关闭');

  } catch (error: any) {
    console.error('\n❌ 迁移失败:', error.message);
    process.exit(1);
  }
};

migrateTickets();
