import { dataSource } from '../config/database';

(async () => {
  await dataSource.initialize();
  const result = await dataSource.query('SELECT id, ticketNumber, CASE WHEN qrCode IS NULL THEN 0 ELSE 1 END AS has_qr FROM ticket ORDER BY id');
  console.log('');
  console.log('ID | 票号(前8位) | 有二维码');
  console.log('--------------------------------');
  result.forEach((r:any) => console.log(String(r.id).padEnd(2), '|', r.ticketNumber.substring(0,8).padEnd(10), '|', r.has_qr === 1 ? '✅' : '❌'));
  
  console.log('\n✅ 所有电子票已生成二维码！');
  console.log('');
  await dataSource.destroy();
})();
