import { dataSource } from '../config/database';

const rawQuery2 = async () => {
  console.log('\n');
  console.log('══════════════════════════════════════════════════════════');
  console.log('           🔍 数据库原始 SQL 查询');
  console.log('══════════════════════════════════════════════════════════\n');

  try {
    await dataSource.initialize();

    // 1. 查看所有表
    console.log('📋 数据库中的所有表:');
    const tables = await dataSource.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    tables.forEach((t: any) => console.log(`   • ${t.name}`));
    console.log('');

    // 2. 查看 ticket 表原始结构
    console.log('──────────────────────────────────────────────────────────');
    console.log('📐 ticket 表原始字段结构:');
    console.log('──────────────────────────────────────────────────────────');
    const schema = await dataSource.query("PRAGMA table_info(ticket);");
    schema.forEach((col: any) => {
      const pk = col.pk ? ' 🔑 PK' : '';
      const notNull = col.notnull ? ' NOT NULL' : '';
      const def = col.dflt_value ? ` DEFAULT: ${col.dflt_value}` : '';
      console.log(`   ${String(col.cid).padEnd(2)} ${col.name.padEnd(18)} ${col.type.padEnd(10)}${pk}${notNull}${def}`);
    });
    console.log('');

    // 3. 查看 ticket 表原始数据
    console.log('──────────────────────────────────────────────────────────');
    console.log('📊 ticket 表原始数据:');
    console.log('──────────────────────────────────────────────────────────');
    const data = await dataSource.query("SELECT * FROM ticket ORDER BY id;");
    
    if (data.length === 0) {
      console.log('   ❌ ticket 表是空的！');
    } else {
      console.log(`   共 ${data.length} 条记录\n`);
      
      // 打印表头
      const headers = Object.keys(data[0]);
      console.log('   ' + headers.map(h => String(h).padEnd(14)).join(' | '));
      console.log('   ' + '-'.repeat(16 * headers.length));
      
      // 打印数据
      data.forEach((row: any) => {
        const values = headers.map(h => {
          let val = String(row[h] ?? 'NULL');
          if (h === 'ticketNumber') val = val.substring(0, 12) + '...';
          return val.padEnd(14);
        });
        console.log('   ' + values.join(' | '));
      });
    }

    console.log('\n══════════════════════════════════════════════════════════\n');

    await dataSource.destroy();

  } catch (error: any) {
    console.error('❌ 查询失败:', error.message);
    console.error(error);
    process.exit(1);
  }
};

rawQuery2();
