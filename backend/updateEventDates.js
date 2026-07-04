const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

// 将美食活动日期改为近期（5月和6月初）
const updateDates = [
  { id: 23, date: '2026-05-15' },  // 夏日甜品品鉴会
  { id: 24, date: '2026-05-20' },  // 咖啡品鉴体验课
  { id: 25, date: '2026-05-28' },  // 红酒品鉴会
  { id: 26, date: '2026-06-01' },  // 法式料理品鉴晚宴
  { id: 27, date: '2026-06-05' },  // 日式料理制作体验
  { id: 28, date: '2026-06-10' },  // 烘焙爱好者交流沙龙
];

let count = 0;
updateDates.forEach((item, index) => {
  db.run(
    'UPDATE event SET date = ? WHERE id = ?',
    [item.date, item.id],
    function(err) {
      if (err) {
        console.error(`更新活动 ${item.id} 失败:`, err.message);
      } else {
        count++;
        console.log(`✓ 更新活动 ${item.id}: 日期改为 ${item.date}`);
      }
      
      if (index === updateDates.length - 1) {
        console.log(`\n已更新 ${count} 个活动日期！`);
        db.close();
      }
    }
  );
});