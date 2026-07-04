const { dataSource } = require('./dist/config/database');

async function fixRegistrationStatus() {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('Database connected successfully');
    
    // 获取所有活动，了解哪些是付费活动
    const eventRepository = dataSource.getRepository('Event');
    const events = await eventRepository.find({
      select: ['id', 'title', 'price']
    });
    
    // 创建活动ID到价格的映射
    const eventPriceMap = new Map();
    events.forEach(event => {
      eventPriceMap.set(event.id, parseFloat(event.price) || 0);
    });
    
    console.log('\n=== Events Information ===');
    events.forEach(event => {
      console.log(`Event ID: ${event.id}, Title: ${event.title}, Price: ¥${event.price}`);
    });
    
    // 获取所有状态为'approved'的报名记录
    const registrationRepository = dataSource.getRepository('Registration');
    const approvedRegistrations = await registrationRepository.find({
      select: ['id', 'userId', 'eventId', 'status', 'paymentId', 'createdAt'],
      where: { status: 'approved' }
    });
    
    console.log(`\n=== Approved Registrations Found: ${approvedRegistrations.length} ===`);
    
    // 统计需要修复的记录
    let fixedCount = 0;
    
    for (const registration of approvedRegistrations) {
      const eventPrice = eventPriceMap.get(registration.eventId) || 0;
      
      // 如果是付费活动且没有支付记录，需要修复状态
      if (eventPrice > 0 && !registration.paymentId) {
        console.log(`\nFixing registration ID ${registration.id}:`);
        console.log(`  User ID: ${registration.userId}`);
        console.log(`  Event ID: ${registration.eventId} (Price: ¥${eventPrice})`);
        console.log(`  Current status: ${registration.status}`);
        console.log(`  Payment ID: ${registration.paymentId || 'None'}`);
        
        // 只更新状态为'pending'，不修改其他字段
        await registrationRepository.update(registration.id, { status: 'pending' });
        
        console.log(`  ✓ Status updated to 'pending'`);
        fixedCount++;
      }
    }
    
    console.log(`\n=== Fix Complete ===`);
    console.log(`Total approved registrations: ${approvedRegistrations.length}`);
    console.log(`Fixed registrations: ${fixedCount}`);
    
    // 关闭数据库连接
    await dataSource.destroy();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error fixing registration status:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 运行修复
fixRegistrationStatus();