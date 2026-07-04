const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function getDateString(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('🗓️  创建未来3天内的近期活动...\n');
  
  const today = getDateString(0);
  const tomorrow = getDateString(1);
  const dayAfter = getDateString(2);
  
  console.log(`   日期范围: ${today} ~ ${dayAfter}\n`);
  
  // 随机选择一些活动更新为近期日期
  const upcomingDates = [today, tomorrow, dayAfter];
  const times = [['09:00', '12:00'], ['14:00', '17:00'], ['19:00', '21:30']];
  
  const eventIds = await new Promise((resolve) => {
    db.all(`
      SELECT id FROM event 
      WHERE status = "published"
      ORDER BY RANDOM()
      LIMIT 8
    `, (err, rows) => resolve(rows.map(r => r.id)));
  });
  
  let updatedCount = 0;
  
  for (let i = 0; i < eventIds.length; i++) {
    const eventId = eventIds[i];
    const date = upcomingDates[i % 3];
    const time = times[i % 3];
    
    await new Promise((resolve) => {
      db.run(`
        UPDATE event 
        SET date = ?, startTime = ?, endTime = ?
        WHERE id = ?
      `, [date, time[0], time[1], eventId], function(err) {
        if (err) {
          console.error(`   ❌ 更新失败 ID:${eventId}:`, err.message);
        } else {
          updatedCount++;
          console.log(`   ✅ 活动 ID:${eventId} -> ${date} ${time[0]}-${time[1]}`);
        }
        resolve();
      });
    });
  }
  
  console.log(`\n🎉 更新完成！共更新了 ${updatedCount} 个近期活动\n`);
  
  // 验证结果
  console.log('📋 近期活动列表:');
  db.all(`
    SELECT id, title, date, startTime, endTime, category 
    FROM event 
    WHERE status = "published"
      AND date >= DATE('now') 
      AND date <= DATE('now', '+3 days')
    ORDER BY date, startTime
  `, (err, events) => {
    if (err) {
      console.error('查询失败:', err.message);
    } else {
      events.forEach(e => {
        console.log(`   [${e.date}] ${e.title} (${e.category})`);
      });
      console.log(`\n   总计: ${events.length} 个近期活动`);
    }
    db.close();
    console.log('\n💡 刷新首页即可看到"近期活动"板块！');
  });
}

main();