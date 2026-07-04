import sqlite3 from 'sqlite3';

const rawQuery = async () => {
  console.log('\n');
  console.log('══════════════════════════════════════════════════════════');
  console.log('           🔍 数据库原始查询 - 不经过 TypeORM');
  console.log('══════════════════════════════════════════════════════════\n');

  try {
    const db = new sqlite3.Database('./database.sqlite');

    // 1. 查看所有表
    console.log('📋 数据库中的所有表:');
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", (err, tables: any[]) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        db.close();
        return;
      }
      
      tables.forEach((t: any) => console.log(`   • ${t.name}`));
      console.log('');

      // 2. 查看 ticket 表原始结构
      console.log('──────────────────────────────────────────────────────────');
      console.log('📐 ticket 表原始字段结构:');
      console.log('──────────────────────────────────────────────────────────');
      db.all("PRAGMA table_info(ticket);", (err, schema: any[]) => {
        if (err) {
          console.error('❌ 查询失败:', err.message);
          db.close();
          return;
        }
        
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
        db.all("SELECT * FROM ticket ORDER BY id;", (err, data: any[]) => {
          if (err) {
            console.error('❌ 查询失败:', err.message);
            db.close();
            return;
          }
          
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
          db.close();
        });
      });
    });

  } catch (error: any) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
};

rawQuery();
