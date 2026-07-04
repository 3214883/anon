const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

// 清空所有社交数据
const tables = ['event_like', 'favorite', 'comment', 'rating'];
tables.forEach(table => {
  db.run('DELETE FROM ' + table, function(err) {
    if (err) console.log('清空 ' + table + ' 失败:', err);
    else console.log('清空 ' + table + ' 成功，删除了 ' + this.changes + ' 条记录');
  });
});

// 重置活动的统计数
db.run('UPDATE event SET likeCount = 0, favoriteCount = 0, commentCount = 0', function(err) {
  if (err) console.log('重置活动统计数失败:', err);
  else console.log('重置活动统计数成功');
});

setTimeout(() => db.close(), 1000);