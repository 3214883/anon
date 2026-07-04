import { dataSource } from '../config/database';
import { Ticket } from '../models/Ticket';
import { generateQRCodeBase64 } from '../utils/qrcodeGenerator';

const fillQRCodes = async () => {
  console.log('\n');
  console.log('══════════════════════════════════════════════════════════');
  console.log('             🔄 批量补生成二维码图片');
  console.log('══════════════════════════════════════════════════════════\n');

  try {
    await dataSource.initialize();

    const ticketRepository = dataSource.getRepository(Ticket);

    // 查询所有没有二维码的票
    const tickets = await ticketRepository.find({
      where: { qrCode: null }
    });

    console.log(`📊 共找到 ${tickets.length} 张没有二维码的电子票\n`);

    let successCount = 0;
    let failCount = 0;

    for (const ticket of tickets) {
      try {
        console.log(`   生成中... ID=${ticket.id} 票号=${ticket.ticketNumber.substring(0, 16)}...`);
        
        const qrCode = await generateQRCodeBase64(ticket.ticketNumber);
        ticket.qrCode = qrCode;
        await ticketRepository.save(ticket);
        
        console.log(`   ✅ ID=${ticket.id} 二维码生成成功`);
        successCount++;
      } catch (error: any) {
        console.log(`   ❌ ID=${ticket.id} 生成失败: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n──────────────────────────────────────────────────────────');
    console.log(`✅ 成功生成: ${successCount} 张`);
    console.log(`❌ 失败: ${failCount} 张`);
    console.log('══════════════════════════════════════════════════════════\n');

    // 验证结果
    const withQR = await ticketRepository.count({ where: { qrCode: null } });
    console.log(`📊 验证: 还剩 ${withQR} 张电子票没有二维码\n`);

    await dataSource.destroy();

  } catch (error: any) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }
};

fillQRCodes();
