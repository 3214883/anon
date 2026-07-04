const { dataSource } = require('./dist/config/database');

async function fixPaymentAssociation() {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('Database connected successfully');
    
    // 1. 找到所有状态为'approved'且paymentStatus为'paid'但paymentId为null的报名记录
    const registrationRepository = dataSource.getRepository('Registration');
    const registrations = await registrationRepository.find({
      where: {
        status: 'approved',
        paymentStatus: 'paid',
        paymentId: null
      }
    });
    
    console.log('\n=== Found registrations with payment status paid but no paymentId ===');
    console.log(`Total registrations: ${registrations.length}`);
    
    if (registrations.length === 0) {
      console.log('No registrations found with this issue');
    } else {
      // 2. 找到对应的支付记录并更新paymentId
      const paymentRepository = dataSource.getRepository('Payment');
      let fixedCount = 0;
      
      for (const registration of registrations) {
        console.log(`\nProcessing registration ID: ${registration.id}`);
        console.log(`  Event ID: ${registration.eventId}`);
        console.log(`  Status: ${registration.status}`);
        console.log(`  Payment Status: ${registration.paymentStatus}`);
        console.log(`  Current paymentId: ${registration.paymentId}`);
        
        // 查找对应的支付记录
        const payment = await paymentRepository.findOne({
          where: { registrationId: registration.id }
        });
        
        if (payment) {
          console.log(`  Found payment record ID: ${payment.id}`);
          console.log(`  Payment amount: ¥${payment.amount}`);
          console.log(`  Payment status: ${payment.status}`);
          
          // 更新报名记录的paymentId
          registration.paymentId = payment.id;
          await registrationRepository.save(registration);
          
          console.log(`  ✓ paymentId updated successfully to ${payment.id}`);
          fixedCount++;
        } else {
          console.log(`  ✗ No payment record found for this registration`);
        }
      }
      
      console.log(`\n=== Fix Complete ===`);
      console.log(`Total registrations processed: ${registrations.length}`);
      console.log(`Fixed registrations: ${fixedCount}`);
    }
    
    // 3. 验证修复结果
    const fixedRegistrations = await registrationRepository.find({
      where: {
        status: 'approved',
        paymentStatus: 'paid'
      },
      select: ['id', 'eventId', 'status', 'paymentStatus', 'paymentId']
    });
    
    console.log('\n=== Verification ===');
    console.log(`Registrations with payment status paid: ${fixedRegistrations.length}`);
    
    const stillMissingPaymentId = fixedRegistrations.filter(reg => !reg.paymentId);
    console.log(`Still missing paymentId: ${stillMissingPaymentId.length}`);
    
    if (stillMissingPaymentId.length > 0) {
      console.log('\nRegistrations still missing paymentId:');
      stillMissingPaymentId.forEach(reg => {
        console.log(`  ID: ${reg.id}, Event ID: ${reg.eventId}`);
      });
    }
    
    // 关闭数据库连接
    await dataSource.destroy();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error fixing payment association:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 运行修复
fixPaymentAssociation();