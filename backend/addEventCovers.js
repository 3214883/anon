const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 按分类分配封面图片
const categoryCovers = {
  1: [ // 社交聚会
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
  ],
  2: [ // 教育培训
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
  ],
  3: [ // 商务会议
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600&h=400&fit=crop',
  ],
  4: [ // 文化艺术
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop',
  ],
  5: [ // 体育健身
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba821?w=600&h=400&fit=crop',
  ],
  6: [ // 亲子家庭
    'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=600&h=400&fit=crop',
  ],
  7: [ // 公益慈善
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=600&h=400&fit=crop',
  ],
  8: [ // 展览展销
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&h=400&fit=crop',
  ],
  9: [ // 娱乐休闲
    'https://images.unsplash.com/photo-1511882150382-421056c89033?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&h=400&fit=crop',
  ],
  10: [ // 行业专业
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=600&h=400&fit=crop',
  ],
  11: [ // 美食餐饮
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop',
  ],
};

function getRandomCover(categoryId) {
  const covers = categoryCovers[categoryId] || categoryCovers[1];
  return covers[Math.floor(Math.random() * covers.length)];
}

async function main() {
  console.log('🖼️  开始为没有封面的活动添加封面...\n');
  
  // 查询没有封面的活动
  const events = await new Promise((resolve) => {
    db.all(`
      SELECT id, title, categoryId, category 
      FROM event 
      WHERE coverImage IS NULL OR coverImage = ''
    `, (err, rows) => resolve(rows));
  });
  
  console.log(`📋 找到 ${events.length} 个没有封面的活动\n`);
  
  let updatedCount = 0;
  
  for (const event of events) {
    const cover = getRandomCover(event.categoryId);
    
    await new Promise((resolve) => {
      db.run(
        'UPDATE event SET coverImage = ? WHERE id = ?',
        [cover, event.id],
        function(err) {
          if (err) {
            console.error(`❌ 更新失败 [${event.id}] ${event.title}:`, err.message);
          } else {
            updatedCount++;
            console.log(`✅ [${event.category}] ${event.title}`);
          }
          resolve();
        }
      );
    });
  }
  
  console.log(`\n🎉 完成！共为 ${updatedCount} 个活动添加了封面图片\n`);
  
  // 验证
  db.get('SELECT COUNT(*) as count FROM event WHERE coverImage IS NULL OR coverImage = \'\'', (err, result) => {
    if (result.count > 0) {
      console.log(`⚠️  还有 ${result.count} 个活动没有封面`);
    } else {
      console.log('✅ 所有活动都已添加封面！');
    }
    db.close();
  });
}

main();