const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 分类数据验证测试 ===\n');

// 1. 检查category表
console.log('1. category表数据：');
db.all('SELECT * FROM category ORDER BY id', (err, categories) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }
  
  console.log(`共 ${categories.length} 个分类：`);
  categories.forEach(cat => {
    console.log(`  ID: ${cat.id}, 名称: "${cat.name}", 是否激活: ${cat.isActive}`);
  });
  
  console.log('\n2. 活动表中的分类分布：');
  
  // 2. 检查活动表中的categoryId分布
  db.all('SELECT categoryId, COUNT(*) as count FROM event WHERE status = "published" GROUP BY categoryId ORDER BY categoryId', (err, stats) => {
    if (err) {
      console.error('查询失败:', err.message);
      db.close();
      return;
    }
    
    console.log('各categoryId对应的已发布活动数量：');
    stats.forEach(stat => {
      const category = categories.find(cat => cat.id === stat.categoryId);
      const categoryName = category ? category.name : '未知分类';
      console.log(`  categoryId: ${stat.categoryId} (${categoryName}) - ${stat.count} 个活动`);
    });
    
    // 3. 检查是否有category字段为空但categoryId不为空的活动
    console.log('\n3. 检查category字段与categoryId不一致的活动：');
    db.all('SELECT id, title, category, categoryId FROM event WHERE status = "published" AND (category IS NULL OR category = "" OR category != (SELECT name FROM category WHERE category.id = event.categoryId))', (err, inconsistentEvents) => {
      if (err) {
        console.error('查询失败:', err.message);
        db.close();
        return;
      }
      
      if (inconsistentEvents.length > 0) {
        console.log('发现不一致的活动：');
        inconsistentEvents.forEach(event => {
          const category = categories.find(cat => cat.id === event.categoryId);
          const expectedCategory = category ? category.name : '未知';
          console.log(`  ID: ${event.id}, 标题: "${event.title}", category字段: "${event.category}", categoryId: ${event.categoryId} (应为: "${expectedCategory}")`);
        });
      } else {
        console.log('所有活动的category字段与categoryId一致');
      }
      
      db.close();
      console.log('\n=== 验证完成 ===');
    });
  });
});