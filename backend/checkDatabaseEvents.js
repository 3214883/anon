const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查数据库中的活动数据 ===\n');

// 查询所有活动
db.all('SELECT id, title, status, createdAt FROM event ORDER BY createdAt DESC', (err, allEvents) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }
  
  console.log(`数据库中总共有 ${allEvents.length} 个活动：\n`);
  allEvents.forEach((event, index) => {
    console.log(`${index + 1}. ID: ${event.id}, 标题: ${event.title}, 状态: ${event.status}, 创建时间: ${event.createdAt}`);
  });
  
  // 查询已发布的活动
  console.log('\n\n=== 已发布的活动 (status = "published") ===\n');
  db.all('SELECT id, title, status, createdAt FROM event WHERE status = "published" ORDER BY createdAt DESC', (err, publishedEvents) => {
    if (err) {
      console.error('查询失败:', err.message);
      db.close();
      return;
    }
    
    console.log(`已发布的活动有 ${publishedEvents.length} 个：\n`);
    publishedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ID: ${event.id}, 标题: ${event.title}, 状态: ${event.status}, 创建时间: ${event.createdAt}`);
    });
    
    // 计算分页
    const limit = 8;
    const totalPages = Math.ceil(publishedEvents.length / limit);
    console.log(`\n\n=== 分页信息 ===`);
    console.log(`每页显示: ${limit} 个活动`);
    console.log(`已发布活动总数: ${publishedEvents.length} 个`);
    console.log(`总页数: ${totalPages} 页`);
    
    // 检查第一页
    console.log(`\n第一页应显示的活动 (最多 ${limit} 个):`);
    publishedEvents.slice(0, limit).forEach((event, index) => {
      console.log(`${index + 1}. ID: ${event.id}, 标题: ${event.title}`);
    });
    
    db.close();
  });
});
