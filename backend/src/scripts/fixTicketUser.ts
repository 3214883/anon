import { dataSource } from '../config/database';
import { Ticket } from '../models/Ticket';

(async () => {
  console.log('\n');
  console.log('══════════════════════════════════════════════════════');
  console.log('             🔄 迁移 userId=0 的电子票');
  console.log('══════════════════════════════════════════════════════\n');

  await dataSource.initialize();
  const repo = dataSource.getRepository(Ticket);
  
  const tickets = await repo.find({ where: { userId: 0 } });
  console.log('📊 找到', tickets.length, '张 userId=0 的电子票\n');
  
  for (const t of tickets) {
    t.userId = 10;
    await repo.save(t);
    console.log('  ✅ Ticket', t.id, '票号', t.ticketNumber.substring(0, 16), '→ 用户 10');
  }
  
  console.log('\n══════════════════════════════════════════════════════');
  console.log('✅ 全部迁移完成！用户 10 现在有', await repo.count({ where: { userId: 10 } }), '张电子票');
  console.log('══════════════════════════════════════════════════════\n');
  
  await dataSource.destroy();
  process.exit(0);
})();