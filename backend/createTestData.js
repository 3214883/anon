const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 测试用户数据
const testUsers = [
  { username: 'zhang_san', email: 'zhang@test.com', name: '张三' },
  { username: 'li_si', email: 'li@test.com', name: '李四' },
  { username: 'wang_wu', email: 'wang@test.com', name: '王五' },
  { username: 'zhao_liu', email: 'zhao@test.com', name: '赵六' },
  { username: 'sun_qi', email: 'sun@test.com', name: '孙七' },
  { username: 'zhou_ba', email: 'zhou@test.com', name: '周八' },
  { username: 'wu_jiu', email: 'wu@test.com', name: '吴九' },
  { username: 'zheng_shi', email: 'zheng@test.com', name: '郑十' },
];

// 11个分类的活动模板
const eventTemplates = {
  1: { // 社交聚会
    category: '社交聚会',
    titles: ['周末桌游派对', '单身交友联谊会', '校友聚餐', '行业 Networking', '生日轰趴', '读书会分享', '咖啡闲聊会', '音乐欣赏沙龙'],
    locations: ['星巴克咖啡', '漫咖啡', '私人会所', '创客空间', '共享会议室', '城市客厅'],
  },
  2: { // 教育培训
    category: '教育培训',
    titles: ['Python编程入门', '英语商务口语', '职场沟通技巧', '思维导图训练', '时间管理课程', '领导力培训', '数据分析实战', '演讲与口才'],
    locations: ['培训中心A座', '在线直播', '创业孵化器', '大学教学楼', '企业会议室'],
  },
  3: { // 商务会议
    category: '商务会议',
    titles: ['AI产业峰会', '投融资对接会', '企业数字化转型', '品牌营销论坛', '人力资源峰会', '供应链管理研讨会', '客户成功大会'],
    locations: ['国际会议中心', '五星酒店宴会厅', '会展中心', '科技园报告厅', '线上会议平台'],
  },
  4: { // 文化艺术
    category: '文化艺术',
    titles: ['油画体验课', '书法入门班', '古典音乐会', '话剧表演工作坊', '摄影采风', '博物馆导览', '花艺设计', '陶艺制作体验'],
    locations: ['美术馆', '艺术中心', '音乐厅', '画廊', '文创园', '博物馆'],
  },
  5: { // 体育健身
    category: '体育健身',
    titles: ['晨跑团集结', '瑜伽周末营', '篮球友谊赛', '羽毛球双打赛', '骑行环湖活动', '攀岩体验', '游泳训练班', '健身房团课'],
    locations: ['体育中心', '城市公园', '健身会所', '羽毛球馆', '攀岩馆', '游泳馆'],
  },
  6: { // 亲子家庭
    category: '亲子家庭',
    titles: ['亲子烘焙课', '儿童手工DIY', '亲子露营', '科学实验秀', '绘本阅读会', '儿童戏剧表演', '亲子趣味运动会', '农场采摘'],
    locations: ['亲子乐园', '儿童科技馆', '城市公园', '休闲农庄', '早教中心'],
  },
  7: { // 公益慈善
    category: '公益慈善',
    titles: ['环保植树活动', '关爱老人探访', '爱心衣物捐赠', '公益跑筹款', '山区支教招募', '流浪动物救助', '无偿献血活动'],
    locations: ['社区服务中心', '公益组织办公室', '敬老院', '山区小学', '市中心广场'],
  },
  8: { // 展览展销
    category: '展览展销',
    titles: ['春季房展会', '新能源汽车展', '文创产品市集', '年货大集', '科技成果展', '进口食品博览会', '智能家居展'],
    locations: ['会展中心', '展览馆', '商业广场', '奥体中心', '博览园'],
  },
  9: { // 娱乐休闲
    category: '娱乐休闲',
    titles: ['密室逃脱组队', 'KTV欢唱夜', '电影鉴赏会', '剧本杀拼车', '狼人杀面杀', '德州扑克友谊赛', '电竞开黑'],
    locations: ['密室体验馆', '量贩KTV', '私人影院', '桌游吧', '网咖', '轰趴馆'],
  },
  10: { // 行业专业
    category: '行业专业',
    titles: ['前端技术分享', '架构设计实战', '产品经理沙龙', 'UI设计工作坊', 'DevOps最佳实践', '大数据分析', '区块链应用研讨'],
    locations: ['互联网公司', '科技园区', '开发者社区', '创业咖啡', '线上技术社区'],
  },
  11: { // 美食餐饮
    category: '美食餐饮',
    titles: ['川菜品鉴会', '日式料理体验', '红酒庄之旅', '咖啡拉花课', '精酿啤酒品鉴', '分子料理秀', '端午粽子DIY', '中秋月饼制作'],
    locations: ['私房菜馆', '葡萄酒庄', '咖啡学院', '精酿酒馆', '厨艺学校', '美食城'],
  },
};

// 随机价格
const prices = [0, 9.9, 19.9, 29.9, 49.9, 99, 128, 198];
// 随机容量
const capacities = [20, 30, 50, 80, 100, 150, 200];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate() {
  const today = new Date();
  const daysLater = Math.floor(Math.random() * 60) + 7; // 7-66天后
  today.setDate(today.getDate() + daysLater);
  return today.toISOString().split('T')[0];
}

async function main() {
  console.log('🚀 开始创建测试数据...\n');
  
  // 1. 删除已结束的活动
  console.log('1️⃣  删除已结束的活动...');
  const deletePromise = new Promise((resolve) => {
    db.run('DELETE FROM event WHERE status = "ended" OR status = "已结束"', function(err) {
      if (err) console.error('删除失败:', err.message);
      else console.log(`   ✅ 已删除 ${this.changes} 个已结束活动\n`);
      resolve();
    });
  });
  await deletePromise;
  
  // 2. 更新所有现有活动状态为published，并设置未来日期
  console.log('2️⃣  更新现有活动状态和日期...');
  const updatePromise = new Promise((resolve) => {
    db.run(`
      UPDATE event 
      SET status = "published", 
          date = ?,
          startTime = "14:00",
          endTime = "18:00"
      WHERE status != "published"
    `, [getRandomDate()], function(err) {
      if (err) console.error('更新失败:', err.message);
      else console.log(`   ✅ 已更新 ${this.changes} 个活动状态\n`);
      resolve();
    });
  });
  await updatePromise;
  
  // 3. 创建用户
  console.log('3️⃣  创建测试用户...');
  const userIds = [];
  
  for (const user of testUsers) {
    const promise = new Promise((resolve) => {
      db.get('SELECT id FROM user WHERE username = ? OR email = ?', [user.username, user.email], (err, existing) => {
        if (existing) {
          console.log(`   ⏭️  用户 ${user.name} 已存在`);
          userIds.push(existing.id);
          resolve();
        } else {
          db.run(`
            INSERT INTO user (username, email, password, name, role, createdAt)
            VALUES (?, ?, ?, ?, 'user', datetime('now'))
          `, [user.username, user.email, '123456', user.name], function(err) {
            if (err) console.error(`创建用户${user.name}失败:`, err.message);
            else {
              console.log(`   ✅  创建用户: ${user.name}`);
              userIds.push(this.lastID);
            }
            resolve();
          });
        }
      });
    });
    await promise;
  }
  console.log('');
  
  // 4. 为每个分类创建至少6个活动
  console.log('4️⃣  为每个分类创建活动...\n');
  
  let totalCreated = 0;
  
  for (const categoryId of Object.keys(eventTemplates)) {
    const template = eventTemplates[categoryId];
    console.log(`   📂 ${template.category} 分类:`);
    
    // 先统计该分类已有多少活动
    const countPromise = new Promise((resolve) => {
      db.get(
        'SELECT COUNT(*) as count FROM event WHERE categoryId = ? AND status = "published"',
        [categoryId],
        (err, result) => resolve(result ? result.count : 0)
      );
    });
    const existingCount = await countPromise;
    
    const needToCreate = Math.max(0, 6 - existingCount);
    console.log(`      已有 ${existingCount} 个活动，需要创建 ${Math.max(needToCreate, 0)} 个`);
    
    for (let i = 0; i < needToCreate; i++) {
      const title = getRandomItem(template.titles);
      const date = getRandomDate();
      const userId = getRandomItem(userIds);
      const location = getRandomItem(template.locations);
      const price = getRandomItem(prices);
      const capacity = getRandomItem(capacities);
      
      const eventPromise = new Promise((resolve) => {
        db.run(`
          INSERT INTO event (
            title, description, date, startTime, endTime, location, 
            price, capacity, registeredCount, categoryId, category,
            status, creatorId, createdAt, views
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
        `, [
          `${title} #${i + 1}`,
          `这是一个关于${template.category}的精彩活动，欢迎大家报名参加！`,
          date,
          '14:00',
          '17:00',
          location,
          price,
          capacity,
          Math.floor(Math.random() * Math.floor(capacity * 0.7)),
          categoryId,
          template.category,
          'published',
          userId,
          Math.floor(Math.random() * 500) + 50
        ], function(err) {
          if (err) console.error(`      创建活动失败:`, err.message);
          else {
            totalCreated++;
            console.log(`      ✅  ${title}`);
          }
          resolve();
        });
      });
      await eventPromise;
    }
    console.log('');
  }
  
  console.log(`\n🎉 数据创建完成！`);
  console.log(`   总共新创建了 ${totalCreated} 个活动`);
  console.log(`   所有活动均为未来日期，可报名状态\n`);
  
  // 5. 统计结果
  console.log('5️⃣  最终分类统计:');
  db.all(`
    SELECT c.id, c.name, COUNT(e.id) as count 
    FROM category c 
    LEFT JOIN event e ON c.id = e.categoryId AND e.status = "published" 
    GROUP BY c.id, c.name 
    ORDER BY c.id
  `, (err, stats) => {
    if (err) {
      console.error('查询失败:', err.message);
    } else {
      let total = 0;
      stats.forEach(s => {
        const status = s.count >= 6 ? '✅' : '⚠️';
        console.log(`   ${status} ${s.name}: ${s.count} 个活动`);
        total += s.count;
      });
      console.log(`\n   总计: ${total} 个已发布活动`);
    }
    
    console.log(`\n💡 测试账号密码: 任意用户名 / 123456`);
    console.log(`   例如: zhang_san / 123456`);
    
    db.close();
  });
}

main();