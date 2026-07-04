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
  
  // 查看event表中的所有数据
  console.log('\n=== 当前event表中的数据 ===');
  db.all('SELECT id, title, description, location, category, tags FROM event', (err, rows) => {
    if (err) {
      console.error('Error querying event table:', err.message);
      return;
    }
    
    rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Title: ${row.title}`);
      console.log(`Description: ${row.description}`);
      console.log(`Location: ${row.location}`);
      console.log(`Category: ${row.category}`);
      console.log(`Tags: ${row.tags}`);
      console.log('---');
    });
    
    // 清理含有问号的项目
    console.log('\n=== 开始清理问号项目 ===');
    
    // 定义需要清理的字段
    const fieldsToClean = ['title', 'description', 'location', 'category', 'tags'];
    
    // 对每个字段执行清理操作
    fieldsToClean.forEach(field => {
      console.log(`清理 ${field} 字段中的问号...`);
      
      // 更新语句：替换问号为空白
      const updateSql = `UPDATE event SET ${field} = REPLACE(${field}, '?', '') WHERE ${field} LIKE '%?%'`;
      
      db.run(updateSql, function(err) {
        if (err) {
          console.error(`Error updating ${field}:`, err.message);
          return;
        }
        console.log(`清理 ${field} 字段完成，影响了 ${this.changes} 行`);
      });
    });
    
    // 查看清理后的数据
    setTimeout(() => {
      console.log('\n=== 清理后的event表数据 ===');
      db.all('SELECT id, title, description, location, category, tags FROM event', (err, rows) => {
        if (err) {
          console.error('Error querying event table:', err.message);
          return;
        }
        
        rows.forEach(row => {
          console.log(`ID: ${row.id}`);
          console.log(`Title: ${row.title}`);
          console.log(`Description: ${row.description}`);
          console.log(`Location: ${row.location}`);
          console.log(`Category: ${row.category}`);
          console.log(`Tags: ${row.tags}`);
          console.log('---');
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
