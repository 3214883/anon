import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("正在清理无用空表")
print("=" * 60)

tables_to_drop = ['chat', 'message', 'file', 'friend']

for table in tables_to_drop:
    try:
        cursor.execute(f"DROP TABLE IF EXISTS '{table}'")
        print(f"✅ 已删除表: {table}")
    except Exception as e:
        print(f"❌ 删除 {table} 失败: {e}")

conn.commit()

print("\n" + "=" * 60)
print("清理后的表列表：")
print("=" * 60)

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = cursor.fetchall()

print(f"{'表名':<25} {'记录数':<10}")
print("-" * 35)

for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT COUNT(*) FROM '{table_name}'")
    count = cursor.fetchone()[0]
    status = "✅" if count > 0 else "⚠️"
    print(f"{table_name:<25} {count:<10} {status}")

conn.close()

print("\n" + "=" * 60)
print(f"✅ 清理完成！共删除 {len(tables_to_drop)} 个空表")
print("=" * 60)
