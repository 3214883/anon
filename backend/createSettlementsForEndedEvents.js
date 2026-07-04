const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const PLATFORM_FEE_RATE = 0.05;

console.log('🔧 为已结束的活动创建结算申请\n');

db.all(`
  SELECT 
    e.id as eventId,
    e.title,
    e.organizerId,
    e.date,
    e.endTime,
    e.price
  FROM event e
  WHERE e.status = 'published'
    AND e.date < date('now')
  ORDER BY e.date DESC
`, (err, events) => {
  if (err) {
    console.error('❌ 查询活动失败:', err.message);
    db.close();
    return;
  }

  console.log(`📋 找到 ${events.length} 个已结束的活动:\n`);
  
  let createdCount = 0;
  let skippedCount = 0;

  const processEvent = (index) => {
    if (index >= events.length) {
      console.log(`\n🎉 完成！创建 ${createdCount} 个结算申请，跳过 ${skippedCount} 个`);
      db.close();
      return;
    }

    const event = events[index];
    
    // 检查是否已有结算申请
    db.get(`SELECT id FROM settlement WHERE eventId = ?`, [event.eventId], (err, row) => {
      if (err) {
        console.error(`❌ 活动 ${event.title} 查询结算失败:`, err.message);
        processEvent(index + 1);
        return;
      }

      if (row) {
        console.log(`   ⏭️ ${event.title} - 已有结算申请`);
        skippedCount++;
        processEvent(index + 1);
        return;
      }

      // 获取该活动的所有支付记录（状态为 completed 或 paid）
      db.all(`
        SELECT amount 
        FROM payment 
        WHERE eventId = ? AND status IN ('completed', 'paid', 'success')
      `, [event.eventId], (err, payments) => {
        if (err) {
          console.error(`❌ 活动 ${event.title} 查询支付失败:`, err.message);
          processEvent(index + 1);
          return;
        }

        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        if (totalAmount === 0) {
          console.log(`   ⏭️ ${event.title} - 无有效支付记录`);
          skippedCount++;
          processEvent(index + 1);
          return;
        }

        const participantCount = payments.length;
        const feeAmount = totalAmount * PLATFORM_FEE_RATE;
        const settleAmount = totalAmount - feeAmount;

        // 创建结算申请
        db.run(`
          INSERT INTO settlement (eventId, organizerId, totalAmount, participantCount, feeAmount, settleAmount, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        `, [event.eventId, event.organizerId, totalAmount, participantCount, feeAmount, settleAmount], function(err) {
          if (err) {
            console.error(`   ❌ ${event.title} - 创建失败:`, err.message);
            skippedCount++;
          } else {
            console.log(`   ✅ ${event.title} - 结算ID:${this.lastID}, 金额:¥${settleAmount.toFixed(2)} (总:¥${totalAmount.toFixed(2)}, 手续费:¥${feeAmount.toFixed(2)})`);
            createdCount++;
          }
          processEvent(index + 1);
        });
      });
    });
  };

  processEvent(0);
});
