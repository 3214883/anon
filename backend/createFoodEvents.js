const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const userEmail = 'test6@example.com';
const categoryName = '美食餐饮';

// 先检查用户是否存在
db.get('SELECT id FROM user WHERE email = ?', [userEmail], async (err, user) => {
  if (err) {
    console.error('查询用户失败:', err.message);
    return;
  }
  
  if (!user) {
    console.log(`用户 ${userEmail} 不存在，正在创建...`);
    db.run(
      'INSERT INTO user (username, email, password, role, isActive) VALUES (?, ?, ?, ?, ?)',
      ['美食达人', userEmail, 'password123', 'user', 1],
      function(err) {
        if (err) {
          console.error('创建用户失败:', err.message);
          return;
        }
        createEvents(this.lastID);
      }
    );
  } else {
    createEvents(user.id);
  }
});

function createEvents(userId) {
  // 检查是否存在美食分类
  db.get('SELECT id FROM category WHERE name = ?', [categoryName], (err, category) => {
    if (err) {
      console.error('查询分类失败:', err.message);
      return;
    }
    
    let categoryId = category ? category.id : null;
    
    // 如果没有美食分类，先创建
    if (!category) {
      db.run(
        'INSERT INTO category (name, icon, sortOrder, description) VALUES (?, ?, ?, ?)',
        [categoryName, 'utensils', 11, '美食活动、餐饮体验等'],
        function(err) {
          if (err) {
            console.error('创建分类失败:', err.message);
            return;
          }
          categoryId = this.lastID;
          insertEvents(userId, categoryId);
        }
      );
    } else {
      insertEvents(userId, categoryId);
    }
  });
}

function insertEvents(userId, categoryId) {
  const events = [
    // 免费活动 (3个)
    {
      title: '夏日甜品品鉴会',
      description: '免费品尝各式夏日甜品，包括冰淇淋、水果沙拉、清凉饮品等',
      date: '2026-06-15',
      startTime: '14:00',
      endTime: '17:00',
      location: '甜品工坊',
      address: '市中心商业街88号',
      capacity: 50,
      price: 0,
      category: '美食餐饮',
      categoryId: categoryId
    },
    {
      title: '咖啡品鉴体验课',
      description: '专业咖啡师带你品尝不同产地的精品咖啡，了解咖啡文化',
      date: '2026-06-20',
      startTime: '10:00',
      endTime: '12:00',
      location: '咖啡学院',
      address: '文化创意园区A栋',
      capacity: 30,
      price: 0,
      category: '美食餐饮',
      categoryId: categoryId
    },
    {
      title: '烘焙爱好者交流沙龙',
      description: '烘焙爱好者齐聚一堂，分享烘焙心得，品尝自制糕点',
      date: '2026-06-25',
      startTime: '14:00',
      endTime: '16:30',
      location: '烘焙小屋',
      address: '幸福小区12号楼',
      capacity: 20,
      price: 0,
      category: '美食餐饮',
      categoryId: categoryId
    },
    // 付费活动 (3个，价格100-300)
    {
      title: '法式料理品鉴晚宴',
      description: '米其林主厨亲自主理，品尝正宗法式大餐，感受浪漫美食之旅',
      date: '2026-06-18',
      startTime: '18:00',
      endTime: '21:00',
      location: '法式餐厅',
      address: '五星级酒店3楼',
      capacity: 40,
      price: 288,
      category: '美食餐饮',
      categoryId: categoryId
    },
    {
      title: '日式料理制作体验',
      description: '学习制作寿司、刺身等日式料理，亲手体验日本美食文化',
      date: '2026-06-22',
      startTime: '10:00',
      endTime: '14:00',
      location: '和风料理教室',
      address: '商业广场B1层',
      capacity: 15,
      price: 198,
      category: '美食餐饮',
      categoryId: categoryId
    },
    {
      title: '红酒品鉴会',
      description: '资深品酒师带你品鉴多款精选红酒，学习红酒品鉴知识',
      date: '2026-06-28',
      startTime: '15:00',
      endTime: '18:00',
      location: '红酒会所',
      address: '滨江大道66号',
      capacity: 25,
      price: 258,
      category: '美食餐饮',
      categoryId: categoryId
    }
  ];

  let count = 0;
  events.forEach((event, index) => {
    db.run(
      `INSERT INTO event (
        title, description, date, startTime, endTime, location, address,
        capacity, price, category, categoryId, organizerId, status, registeredCount,
        viewCount, likeCount, favoriteCount, commentCount, isSponsored, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0, 0, 0, 0, 0, ?, ?)`,
      [
        event.title,
        event.description,
        event.date,
        event.startTime,
        event.endTime,
        event.location,
        event.address,
        event.capacity,
        event.price,
        event.category,
        event.categoryId,
        userId,
        new Date().toISOString(),
        new Date().toISOString()
      ],
      function(err) {
        if (err) {
          console.error(`创建活动 ${event.title} 失败:`, err.message);
        } else {
          count++;
          console.log(`✓ 创建活动: ${event.title} (ID: ${this.lastID}, 价格: ${event.price === 0 ? '免费' : `¥${event.price}`})`);
        }
        
        if (index === events.length - 1) {
          console.log(`\n已成功创建 ${count} 个美食分类活动！`);
          console.log(`- 免费活动: ${events.filter(e => e.price === 0).length} 个`);
          console.log(`- 付费活动: ${events.filter(e => e.price > 0).length} 个`);
          db.close();
        }
      }
    );
  });
}