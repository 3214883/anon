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
  
  console.log('category表有 ' + categories.length + ' 条记录：');
  categories.forEach(cat => {
    console.log(`ID: ' + cat.id + ', 名称: ' + cat.name);
  });
  
  console.log('\n\n=== 活动表中各categoryId对应的活动 ===\n');
  // 查询每个category表对应的活动：');
  
  // 查看看每个categoryId对应的活动：
  categories.forEach(cat => {
    db.all('SELECT id, title, category, categoryId FROM event WHERE status = "published" AND categoryId = ?', [cat.id], (err, events) => {
      if (err) {
        console.error('查询失败:', err.message);
        return;
      }
      console.log('\n分类 ' + cat.name + ' (ID: ' + cat.id + ') 有 ' + events.length + ' 个活动：');
      events.forEach(event => {
        console.log('  ID: ' + event.id + ', 标题: ' + event.title + ', category字段: ' + event.category);
      });
    });
  });
  
  // 3秒后关闭数据库
  setTimeout(() => {
    db.close();
    console.log('\n\n=== 检查完成 ===');
  }, 3000);
});
