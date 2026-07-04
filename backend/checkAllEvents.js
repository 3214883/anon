const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

console.log('=== 所有活动列表（按日期排序） ===\n');

db.all('SELECT id, title, date, price, status, category FROM event ORDER BY date DESC', (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }
  
  console.log(`共 ${rows.length} 个活动:`);
  rows.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`标题: ${row.title}`);
    console.log(`日期: ${row.date}`);
    console.log(`价格: ${row.price === 0 ? '免费' : `¥${row.price}`}`);
    console.log(`状态: ${row.status}`);
    console.log(`分类: ${row.category}`);
    console.log('---');
  });
  
  db.close();
});