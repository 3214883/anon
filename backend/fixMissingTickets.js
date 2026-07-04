const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 补全缺失的电子票记录\n');

db.all(`
  SELECT 
    r.id as registrationId,
    r.userId,
    r.eventId,
    r.totalAmount,
    r.createdAt,
    e.title as eventTitle
  FROM registration r
  LEFT JOIN event e ON r.eventId = e.id
  WHERE r.paymentStatus = 'paid' 
    AND r.id NOT IN (SELECT registrationId FROM ticket)
  ORDER BY r.id DESC
`, async (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('✅ 所有已支付报名都已有电子票记录');
    db.close();
    return;
  }

  console.log(`📋 找到 ${rows.length} 条已支付但缺少电子票的记录:\n`);

  let fixedCount = 0;

  const processNext = (index) => {
    if (index >= rows.length) {
      console.log(`\n🎉 完成！共补全 ${fixedCount} 张电子票`);
      db.close();
      return;
    }

    const reg = rows[index];
    const ticketNumber = uuidv4().toUpperCase().replace(/-/g, '');

    db.run(`
      INSERT INTO ticket (userId, eventId, registrationId, ticketNumber, status, ticketType, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      reg.userId, 
      reg.eventId, 
      reg.registrationId, 
      ticketNumber, 
      'valid', 
      reg.totalAmount > 0 ? '付费票' : '免费票',
      reg.createdAt || new Date().toISOString()
    ], function(err2) {
      if (err2) {
        console.log(`   ❌ 报名ID:${reg.registrationId} 创建失败:`, err2.message);
      } else {
        fixedCount++;
        console.log(`   ✅ 报名ID:${reg.registrationId} → 票号:${ticketNumber.slice(0, 12)}... | ${reg.eventTitle} (¥${reg.totalAmount})`);
      }
      processNext(index + 1);
    });
  };

  processNext(0);
});
