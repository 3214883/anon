const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查美食活动 ===\n');

// 查询美食活动
db.all('SELECT id, title, category, categoryId FROM event WHERE status = "published" AND (category LIKE "%美食%" OR categoryId = 11)', (err, events) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }
  
  console.log('找到', events.length, '个美食活动：');
  events.forEach(event => {
    console.log('ID:', event.id, ', 标题:', event.title, ', category:', event.category, ', categoryId:', event.categoryId);
  });
  
  db.close();
});
