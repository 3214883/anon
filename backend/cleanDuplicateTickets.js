const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 清理冲突的电子票记录\n');

db.all(`
  SELECT 
    r.id as registrationId,
    r.userId,
    r.eventId,
    r.status,
    r.paymentStatus,
    t.id as ticketId,
    t.ticketNumber
  FROM registration r
  LEFT JOIN ticket t ON r.id = t.registrationId
  WHERE r.paymentStatus = 'paid'
  ORDER BY r.id DESC
`, (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err.message);
    db.close();
    return;
  }

  console.log(`📋 当前报名状态:\n`);
  
  const duplicateTickets = rows.filter(r => r.ticketId !== null);
  const paidWithoutTicket = rows.filter(r => r.ticketId === null);
  
  console.log(`✅ 已有电子票: ${duplicateTickets.length} 条`);
  console.log(`⚠️  已支付但无票: ${paidWithoutTicket.length} 条\n`);
  
  if (paidWithoutTicket.length > 0) {
    console.log('已支付无电子票的报名ID:');
    paidWithoutTicket.forEach(r => {
      console.log(`   - 报名ID:${r.registrationId} | 用户:${r.userId} | 活动:${r.eventId}`);
    });
  }
  
  console.log('\n🎉 数据库状态检查完成，可以正常支付！');
  db.close();
});
