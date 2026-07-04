const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📋 检查报名数据...\n');

db.all(`
  SELECT id, userId, eventId, paymentId, paymentStatus, totalAmount, status
  FROM registration 
  ORDER BY id DESC
  LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  console.log('最近10条报名记录:');
  console.log('========================================');
  rows.forEach(row => {
    console.log(`ID:${row.id} | 用户:${row.userId} | 活动:${row.eventId} | paymentId:${row.paymentId} | paymentStatus:${row.paymentStatus} | 金额:${row.totalAmount} | 状态:${row.status}`);
  });
  
  console.log('\n📊 paymentId 类型统计:');
  console.log('========================================');
  db.all(`
    SELECT 
      COUNT(*) as count,
      paymentId,
      typeof(paymentId) as type
    FROM registration
    GROUP BY paymentId, typeof(paymentId)
    ORDER BY count DESC
  `, (err2, rows2) => {
    if (err2) {
      console.error(err2);
    } else {
      rows2.forEach(r => {
        console.log(`paymentId:${r.paymentId} (${r.type}) → ${r.count}条记录`);
      });
    }
    db.close();
    console.log('\n✅ 查询完成!');
  });
});
