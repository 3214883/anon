const { dataSource } = require('./dist/config/database');

async function fixPaymentId() {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('Database connected successfully');
    
    // 获取所有支付记录
    const paymentRepository = dataSource.getRepository('Payment');
    const payments = await paymentRepository.find({
      select: ['id', 'registrationId']
    });
    
    console.log('\n=== Fixing Payment ID Association ===');
    console.log(`Total payments to process: ${payments.length}`);
    
    let fixedCount = 0;
    
    for (const payment of payments) {
      if (payment.registrationId) {
        // 获取对应的报名记录
        const registrationRepository = dataSource.getRepository('Registration');
        const registration = await registrationRepository.findOne({
          where: { id: payment.registrationId }
        });
        
        if (registration && registration.paymentId !== payment.id) {
          console.log(`Fixing registration ${registration.id}:`);
          console.log(`  Current paymentId: ${registration.paymentId || 'None'}`);
          console.log(`  Should be: ${payment.id}`);
          
          // 更新paymentId
          registration.paymentId = payment.id;
          await registrationRepository.save(registration);
          
          console.log(`  ✓ Payment ID updated successfully`);
          fixedCount++;
        }
      }
    }
    
    console.log(`\n=== Fix Complete ===`);
    console.log(`Fixed registrations: ${fixedCount}`);
    
    // 验证修复结果
    const registrationRepository = dataSource.getRepository('Registration');
    const registrationsWithPayment = await registrationRepository.find({
      where: { paymentId: notnull() }
    });
    
    console.log(`\n=== Verification ===`);
    console.log(`Registrations with paymentId: ${registrationsWithPayment.length}`);
    
    // 关闭数据库连接
    await dataSource.destroy();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error fixing payment ID association:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 辅助函数：生成NOT NULL条件
function notnull() {
  return Not(null);
}

// 导入Not操作符
const { Not } = require('typeorm');

// 运行修复
fixPaymentId();