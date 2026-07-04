const { dataSource } = require('./dist/config/database');

async function checkUserRegistration(userId = 10) {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('Database connected successfully');
    
    // 获取用户的所有报名记录
    const registrationRepository = dataSource.getRepository('Registration');
    const registrations = await registrationRepository.find({
      select: ['id', 'eventId', 'status', 'paymentId', 'paymentStatus', 'ticketId', 'ticketStatus', 'createdAt'],
      where: { userId },
      order: {
        createdAt: 'DESC'
      }
    });
    
    console.log(`\n=== User ${userId} Registration Records ===`);
    console.log(`Total registrations: ${registrations.length}`);
    
    if (registrations.length === 0) {
      console.log('No registration records found');
    } else {
      for (const registration of registrations) {
        console.log(`\nRegistration ID: ${registration.id}`);
        console.log(`Event ID: ${registration.eventId}`);
        console.log(`Status: ${registration.status}`);
        console.log(`Payment ID: ${registration.paymentId || 'None'}`);
        console.log(`Payment Status: ${registration.paymentStatus}`);
        console.log(`Ticket ID: ${registration.ticketId || 'None'}`);
        console.log(`Ticket Status: ${registration.ticketStatus}`);
        console.log(`Created At: ${new Date(registration.createdAt).toLocaleString()}`);
        
        // 检查对应的支付记录
        if (registration.paymentId) {
          const paymentRepository = dataSource.getRepository('Payment');
          const payment = await paymentRepository.findOne({
            where: { id: registration.paymentId }
          });
          if (payment) {
            console.log(`\n  Payment Details:`);
            console.log(`  Payment ID: ${payment.id}`);
            console.log(`  Amount: ¥${payment.amount}`);
            console.log(`  Status: ${payment.status}`);
            console.log(`  Payment Method: ${payment.paymentMethod}`);
          }
        }
        
        // 检查对应的电子票记录
        if (registration.ticketId) {
          const ticketRepository = dataSource.getRepository('Ticket');
          const ticket = await ticketRepository.findOne({
            where: { registrationId: registration.id }
          });
          if (ticket) {
            console.log(`\n  Ticket Details:`);
            console.log(`  Ticket ID: ${ticket.id}`);
            console.log(`  Ticket Number: ${ticket.ticketNumber}`);
            console.log(`  Status: ${ticket.status}`);
            console.log(`  Ticket Type: ${ticket.ticketType}`);
          }
        }
      }
    }
    
    // 关闭数据库连接
    await dataSource.destroy();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error checking user registration:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 运行检查
checkUserRegistration();