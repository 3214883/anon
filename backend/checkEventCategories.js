const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查所有活动的分类情况 ===\n');

// 先查询category表
console.log('=== 分类ID对应表 ===');
db.all('SELECT id, name FROM category ORDER BY id', (err, categories) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }
  
  categories.forEach(cat => {
    console.log(`ID: ${cat.id} - ${cat.name}`);
  });
  
  console.log('\n=== 所有活动当前分类 ===\n');
  
  // 查询所有活动
  db.all('SELECT id, title, category, categoryId FROM event WHERE status = "published" ORDER BY categoryId, id', (err, events) => {
    if (err) {
      console.error('查询失败:', err.message);
      db.close();
      return;
    }
    
    console.log(`共 ${events.length} 个已发布活动：\n`);
    
    events.forEach(event => {
      const categoryName = categories.find(c => c.id === event.categoryId);
      console.log(`ID: ${event.id}`);
      console.log(`  标题: ${event.title}`);
      console.log(`  category字段: ${event.category}`);
      console.log(`  categoryId: ${event.categoryId} (${categoryName ? categoryName.name : '未知'})`);
      console.log('---');
    });
    
    // 统计
    console.log('\n=== 按categoryId统计 ===\n');
    const stats = {};
    events.forEach(event => {
      const key = event.categoryId || 'NULL';
      if (!stats[key]) stats[key] = 0;
      stats[key]++;
    });
    
    Object.keys(stats).forEach(key => {
      const categoryName = categories.find(c => c.id === parseInt(key));
      console.log(`categoryId: ${key} (${categoryName ? categoryName.name : '未知'}) - ${stats[key]} 个活动`);
    });
    
    db.close();
    console.log('\n=== 检查完成 ===');
  });
});