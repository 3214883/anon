const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

// 将美食活动状态从 active 改为 published
db.run(
  'UPDATE event SET status = "published" WHERE category = "美食餐饮"',
  function(err) {
    if (err) {
      console.error('更新状态失败:', err.message);
    } else {
      console.log(`✓ 成功更新 ${this.changes} 个美食活动的状态为 published`);
    }
    db.close();
  }
);