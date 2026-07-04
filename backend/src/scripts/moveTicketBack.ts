import { dataSource } from '../config/database';
import { Ticket } from '../models/Ticket';

(async () => {
  console.log('\n');
  console.log('══════════════════════════════════════════════════════');
  console.log('             🔄 移回 userId=0 的电子票');
  console.log('══════════════════════════════════════════════════════\n');

  await dataSource.initialize();
  const repo = dataSource.getRepository(Ticket);
  
  const tickets10 = await repo.find({ where: { userId: 10 } });
  console.log('📊 用户 10 有', tickets10.length, '张电子票，移回 0\n');
  
  for (const t of tickets10) {
    t.userId = 0;
    await repo.save(t);
    console.log('  ✅ Ticket', t.id, '票号', t.ticketNumber.substring(0, 16), '→ 用户 0');
  }
  
  console.log('\n══════════════════════════════════════════════════════');
  console.log('✅ 用户 0 现在有', await repo.count({ where: { userId: 0 } }), '张电子票');
  console.log('══════════════════════════════════════════════════════\n');
  
  await dataSource.destroy();
  process.exit(0);
})();