const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
  
  // 定义有意义的活动ID（这些是原始的seed数据）
  const meaningfulEventIds = [1, 2, 3, 4, 5, 0, 7];
  
  // 查看所有活动
  console.log('\n=== 当前所有活动 ===');
  db.all('SELECT id, title, description, location FROM event', (err, rows) => {
    if (err) {
      console.error('Error querying event table:', err.message);
      return;
    }
    
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Title: "${row.title}", Description: "${row.description}", Location: "${row.location}"`);
    });
    
    // 删除不是有意义的活动
    console.log('\n=== 开始删除无意义的活动 ===');
    
    rows.forEach(row => {
      if (!meaningfulEventIds.includes(row.id)) {
        console.log(`删除活动 ID: ${row.id}, Title: "${row.title}"`);
        db.run('DELETE FROM event WHERE id = ?', [row.id], function(err) {
          if (err) {
            console.error(`Error deleting event ${row.id}:`, err.message);
            return;
          }
          console.log(`活动 ID: ${row.id} 删除成功`);
        });
      }
    });
    
    // 查看删除后的活动
    setTimeout(() => {
      console.log('\n=== 删除后的活动 ===');
      db.all('SELECT id, title, description, location FROM event', (err, rows) => {
        if (err) {
          console.error('Error querying event table:', err.message);
          return;
        }
        
        rows.forEach(row => {
          console.log(`ID: ${row.id}, Title: "${row.title}", Description: "${row.description}", Location: "${row.location}"`);
        });
        
        // 关闭数据库连接
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            return;
          }
          console.log('Database connection closed.');
        });
      });
    }, 1000);
  });
});
