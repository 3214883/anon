const { dataSource } = require('./src/config/database');
const { Event } = require('./src/models/Event');

async function checkPage2() {
  try {
    await dataSource.initialize();
    const eventRepository = dataSource.getRepository(Event);
    
    // 按创建时间倒序查询所有已发布的活动
    const [allEvents, total] = await eventRepository.findAndCount({
      where: { status: 'published' },
      order: { createdAt: 'DESC' }
    });
    
    console.log('=== 数据库中所有已发布活动 ===');
    console.log(`总计: ${total} 个活动\n`);
    
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}. ID: ${event.id}, 标题: ${event.title}, 状态: ${event.status}`);
    });
    
    // 计算分页
    const limit = 8;
    const totalPages = Math.ceil(total / limit);
    
    console.log(`\n=== 分页信息 ===`);
    console.log(`每页: ${limit} 个活动`);
    console.log(`总页数: ${totalPages} 页`);
    
    // 显示第二页的活动
    if (totalPages >= 2) {
      const page2Start = (2 - 1) * limit;
      const page2End = page2Start + limit;
      const page2Events = allEvents.slice(page2Start, page2End);
      
      console.log(`\n=== 第二页应显示的活动 (${page2Events.length} 个) ===`);
      page2Events.forEach((event, index) => {
        console.log(`${page2Start + index + 1}. ID: ${event.id}, 标题: ${event.title}, 状态: ${event.status}`);
      });
    }
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error checking events:', error);
  }
}

checkPage2();
