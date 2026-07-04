const { dataSource } = require('./dist/config/database');

async function checkDatabaseValues() {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('Database connected successfully');
    
    // 直接执行SQL查询来查看原始数据
    const queryRunner = dataSource.createQueryRunner();
    
    // 查看payment表的原始数据
    console.log('\n=== Payment Table Raw Data ===');
    const payments = await queryRunner.query('SELECT * FROM payment');
    console.log('Payments:', payments);
    
    // 查看registration表的原始数据
    console.log('\n=== Registration Table Raw Data ===');
    const registrations = await queryRunner.query('SELECT id, eventId, status, paymentStatus, paymentId FROM registration WHERE id = 31');
    console.log('Registrations:', registrations);
    
    // 尝试直接更新paymentId
    if (registrations.length > 0) {
      console.log('\n=== Updating paymentId directly ===');
      await queryRunner.query('UPDATE registration SET paymentId = 0 WHERE id = 31');
      console.log('PaymentId updated directly');
      
      // 再次查询验证
      const updatedRegistration = await queryRunner.query('SELECT id, eventId, status, paymentStatus, paymentId FROM registration WHERE id = 31');
      console.log('Updated registration:', updatedRegistration);
    }
    
    // 关闭查询runner
    await queryRunner.release();
    
    // 关闭数据库连接
    await dataSource.destroy();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error checking database values:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 运行检查
checkDatabaseValues();