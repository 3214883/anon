const { dataSource } = require('./dist/config/database');

async function checkPaymentStatus() {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('Database connected successfully');
    
    // 获取所有支付记录
    const paymentRepository = dataSource.getRepository('Payment');
    const payments = await paymentRepository.find({
      select: ['id', 'userId', 'registrationId', 'eventId', 'amount', 'status', 'paymentMethod', 'transactionId', 'createdAt'],
      order: {
        createdAt: 'DESC'
      }
    });
    
    console.log('\n=== Payment Records ===');
    console.log(`Total payments: ${payments.length}`);
    
    if (payments.length === 0) {
      console.log('No payment records found');
    } else {
      payments.forEach(payment => {
        console.log(`\nID: ${payment.id}`);
        console.log(`User ID: ${payment.userId}`);
        console.log(`Registration ID: ${payment.registrationId}`);
        console.log(`Event ID: ${payment.eventId}`);
        console.log(`Amount: ¥${payment.amount}`);
        console.log(`Status: ${payment.status}`);
        console.log(`Payment Method: ${payment.paymentMethod}`);
        console.log(`Transaction ID: ${payment.transactionId}`);
        console.log(`Created At: ${new Date(payment.createdAt).toLocaleString()}`);
      });
    }
    
    // 检查报名记录的状态
    const registrationRepository = dataSource.getRepository('Registration');
    const registrations = await registrationRepository.find({
      select: ['id', 'userId', 'eventId', 'status', 'paymentId', 'paymentStatus', 'createdAt'],
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
        console.log(`Payment Status: ${reg.paymentStatus}`);
        console.log(`Created At: ${new Date(reg.createdAt).toLocaleString()}`);
      });
    }
    
    // 关闭数据库连接
    await dataSource.destroy();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 运行检查
checkPaymentStatus();