const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 修复支付订单数据...\n');

db.all(`
  SELECT r.id, r.userId, r.eventId, r.totalAmount, e.title, e.price
  FROM registration r
  LEFT JOIN event e ON r.eventId = e.id
  WHERE r.paymentId IS NULL AND e.price > 0
`, (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }
  
  console.log(`找到 ${rows.length} 条需要补充支付订单的报名记录:\n`);
  
  let fixedCount = 0;
  
  const processNext = (index) => {
    if (index >= rows.length) {
      console.log(`\n✅ 完成！共修复了 ${fixedCount} 条记录`);
      db.close();
      return;
    }
    
    const reg = rows[index];
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    db.run(`
      INSERT INTO payment (userId, eventId, registrationId, amount, status, orderId, paymentMethod, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [reg.userId, reg.eventId, reg.id, reg.totalAmount || reg.price, 'pending', orderId, 'alipay'], function(err2) {
      if (err2) {
        console.log(`   ❌ 报名ID:${reg.id} 创建失败:`, err2.message);
      } else {
        const paymentId = this.lastID;
        db.run(`
          UPDATE registration 
          SET paymentId = ?, paymentStatus = 'pending'
          WHERE id = ?
        `, [paymentId, reg.id], function(err3) {
          if (err3) {
            console.log(`   ❌ 报名ID:${reg.id} 更新失败:`, err3.message);
          } else {
            fixedCount++;
            console.log(`   ✅ 报名ID:${reg.id} → 支付订单ID:${paymentId} | ${reg.title} (¥${reg.totalAmount || reg.price})`);
          }
          processNext(index + 1);
        });
      }
    });
  };
  
  processNext(0);
});
