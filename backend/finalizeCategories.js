const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 更新赛车活动到体育健身分类
db.run('UPDATE event SET categoryId = 5, category = "体育健身" WHERE id = 22', function(err) {
  if (err) {
    console.error('更新失败:', err.message);
  } else if (this.changes > 0) {
    console.log('✅ 赛车活动已更新到体育健身分类\n');
  }
  
  // 统计各分类的活动数量
  console.log('=== 各分类活动数量统计 ===\n');
  db.all(`
    SELECT c.id, c.name, COUNT(e.id) as count 
    FROM category c 
    LEFT JOIN event e ON c.id = e.categoryId AND e.status = "published" 
    GROUP BY c.id, c.name 
    ORDER BY c.id`, (err, stats) => {
    if (err) {
      console.error('查询失败:', err.message);
    } else {
      let total = 0;
      stats.forEach(s => {
        console.log(`ID: ${s.id} - ${s.name}: ${s.count} 个活动`);
        total += s.count;
      });
      console.log(`\n总计: ${total} 个已发布活动已正确分类`);
    }
    
    // 检查是否还有categoryId为null的活动
    db.all('SELECT id, title FROM event WHERE status = "published" AND (categoryId IS NULL OR categoryId = 0)', (err, events) => {
      if (events && events.length > 0) {
        console.log('\n⚠️  仍有未分类的活动:');
        events.forEach(e => console.log(`  ID: ${e.id} - ${e.title}`));
      } else {
        console.log('\n🎉 所有活动都已正确分类！');
      }
      db.close();
    });
  });
});