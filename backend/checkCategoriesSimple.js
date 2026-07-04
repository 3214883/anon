const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查category表内容 ===\n');

// 查询category表
db.all('SELECT id, name FROM category', (err, categories) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }
  
  console.log('category表有', categories.length, '条记录：');
  categories.forEach(cat => {
    console.log('ID:', cat.id, ', 名称:', cat.name);
  });
  
  db.close();
});
