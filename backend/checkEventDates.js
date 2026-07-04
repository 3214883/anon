const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查活动日期格式\n');

db.all(`
  SELECT id, title, date, startTime, status 
  FROM event 
  ORDER BY date DESC 
  LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err.message);
    db.close();
    return;
  }

  console.log('活动日期数据:');
  console.log('================');
  
  rows.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`  标题: ${row.title}`);
    console.log(`  日期: ${row.date} (类型: ${typeof row.date})`);
    console.log(`  时间: ${row.startTime}`);
    console.log(`  状态: ${row.status}`);
    
    // 检查日期格式是否正确
    const dateParts = row.date?.split('-');
    if (dateParts && dateParts.length === 3) {
      const [year, month, day] = dateParts.map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        console.log(`  ✅ 日期格式正确: ${year}-${month}-${day}`);
      } else {
        console.log(`  ❌ 日期格式错误`);
      }
    } else {
      console.log(`  ❌ 日期格式不匹配: ${row.date}`);
    }
    
    console.log('');
  });

  db.close();
});
