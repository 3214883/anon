const { dataSource } = require('./dist/config/database');

async function checkRegistrationStatus() {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('Database connected successfully');
    
    // 获取registration表的所有记录
    const registrationRepository = dataSource.getRepository('Registration');
    const registrations = await registrationRepository.find({
      select: ['id', 'userId', 'eventId', 'status', 'paymentId', 'createdAt'],
      order: {
        createdAt: 'DESC'
      }
    });
    
    console.log('\n=== Registration Records ===');
    console.log(`Total registrations: ${registrations.length}`);
    
    if (registrations.length === 0) {
      console.log('No registration records found');
    } else {
      registrations.forEach(reg => {
        console.log(`\nID: ${reg.id}`);
        console.log(`User ID: ${reg.userId}`);
        console.log(`Event ID: ${reg.eventId}`);
        console.log(`Status: ${reg.status}`);
        console.log(`Payment ID: ${reg.paymentId || 'None'}`);
        console.log(`Created At: ${new Date(reg.createdAt).toLocaleString()}`);
      });
    }
    
    // 检查是否有状态为'approved'的记录
    const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');
    console.log(`\n=== Approved Registrations ===`);
    console.log(`Total approved: ${approvedRegistrations.length}`);
    
    if (approvedRegistrations.length > 0) {
      console.log('\nApproved registration details:');
      approvedRegistrations.forEach(reg => {
        console.log(`ID: ${reg.id}, User ID: ${reg.userId}, Event ID: ${reg.eventId}`);
      });
    }
    
    // 关闭数据库连接
    await dataSource.destroy();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error checking registration status:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 运行检查
checkRegistrationStatus();