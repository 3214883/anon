const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查各分类下的活动数量 ===\n');

// 先查看所有分类
db.all('SELECT id, name FROM category', (err, categories) => {
  if (err) {
    console.error('查询分类失败:', err.message);
    db.close();
    return;
  }
  
  console.log('所有分类：');
  categories.forEach(cat => {
    console.log(`- ID: ${cat.id}, 名称: ${cat.name}`);
  });
  
  console.log('\n\n=== 各分类下的活动数量 ===\n');
  
  // 对每个分类统计活动数量
  categories.forEach(cat => {
    db.all('SELECT id, title FROM event WHERE status = "published" AND (category = ? OR categoryId = ?)', [cat.name, cat.id], (err, events) => {
      if (err) {
        console.error('查询失败:', err.message);
        return;
      }
      console.log(`\n分类 "${cat.name}" 有 ${events.length} 个活动：`);
      events.forEach((event, index) => {
        console.log(`  ${index + 1}. ID: ${event.id}, 标题: ${event.title}`);
      });
      
      // 计算该分类的分页
      const limit = 8;
      const totalPages = Math.ceil(events.length / limit);
      console.log(`  - 分页信息: 每页 ${limit} 个, 总页数 ${totalPages} 页`);
    });
  });
  
  // 等5秒后关闭数据库
  setTimeout(() => {
    db.close();
    console.log('\n\n=== 检查完成 ===');
  }, 5000);
});
