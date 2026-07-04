const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查电子票数据\n');

// 查询所有电子票
db.all(`
  SELECT 
    t.id,
    t.userId,
    t.eventId,
    t.registrationId,
    t.ticketNumber,
    t.status,
    t.ticketType,
    t.createdAt,
    e.title as eventTitle,
    u.username
  FROM ticket t
  LEFT JOIN event e ON t.eventId = e.id
  LEFT JOIN user u ON t.userId = u.id
  ORDER BY t.id DESC
  LIMIT 20
`, (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('⚠️  数据库中暂无电子票记录');
  } else {
    console.log(`✅ 找到 ${rows.length} 张电子票:\n`);
    rows.forEach(t => {
      console.log(`🎫 ID:${t.id} | 用户:${t.username || t.userId} | 活动:${t.eventTitle} | 状态:${t.status} | 票号:${t.ticketNumber?.slice(0, 12)}...`);
    });
  }
  
  console.log('\n📊 按用户统计电子票:');
  db.all(`
    SELECT userId, COUNT(*) as count
    FROM ticket 
    GROUP BY userId
    ORDER BY count DESC
  `, (err2, rows2) => {
    if (!err2 && rows2.length > 0) {
      rows2.forEach(r => {
        console.log(`   用户ID ${r.userId}: ${r.count} 张`);
      });
    }
    db.close();
  });
});
