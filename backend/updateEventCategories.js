const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 开始更新活动分类 ===\n');

// 定义每个活动的正确分类
const categoryUpdates = [
  { id: 0, categoryId: 9, categoryName: '娱乐休闲' },
  { id: 1, categoryId: 5, categoryName: '体育健身' },
  { id: 2, categoryId: 4, categoryName: '文化艺术' },
  { id: 3, categoryId: 10, categoryName: '行业专业' },
  { id: 4, categoryId: 5, categoryName: '体育健身' },
  { id: 5, categoryId: 11, categoryName: '美食餐饮' },
  { id: 7, categoryId: 9, categoryName: '娱乐休闲' },
  { id: 17, categoryId: 10, categoryName: '行业专业' },
  { id: 18, categoryId: 4, categoryName: '文化艺术' },
  { id: 19, categoryId: 9, categoryName: '娱乐休闲' },
  { id: 20, categoryId: 10, categoryName: '行业专业' },
  { id: 21, categoryId: 4, categoryName: '文化艺术' }
];

let updatedCount = 0;

function updateCategory(index) {
  if (index >= categoryUpdates.length) {
    console.log(`\n✅ 更新完成！共更新了 ${updatedCount} 个活动的分类\n`);
    
    // 验证更新结果
    console.log('=== 验证更新结果 ===\n');
    db.all('SELECT id, title, category, categoryId FROM event ORDER BY categoryId', (err, events) => {
      if (err) {
        console.error('查询失败:', err.message);
        db.close();
        return;
      }
      
      events.forEach(event => {
        console.log(`ID: ${event.id} - ${event.title}`);
        console.log(`  categoryId: ${event.categoryId}, category字段: ${event.category}`);
      });
      
      db.close();
      console.log('\n=== 分类更新完成 ===');
    });
    return;
  }
  
  const update = categoryUpdates[index];
  
  // 更新categoryId和category字段
  db.run(
    'UPDATE event SET categoryId = ?, category = ? WHERE id = ?',
    [update.categoryId, update.categoryName, update.id],
    function(err) {
      if (err) {
        console.error(`更新活动ID ${update.id} 失败:`, err.message);
      } else {
        if (this.changes > 0) {
          console.log(`✅ 活动ID: ${update.id} - "${update.categoryName}" - 更新成功`);
          updatedCount++;
        } else {
          console.log(`⚠️  活动ID: ${update.id} - 没有需要更新的记录`);
        }
      }
      setTimeout(() => updateCategory(index + 1), 100);
    }
  );
}

// 开始更新
updateCategory(0);