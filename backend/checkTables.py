import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 80)
print("数据库表检查报告")
print("=" * 80)

# 获取所有表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()

table_stats = []

for table in tables:
    table_name = table[0]
    
    # 跳过系统表
    if table_name.startswith('sqlite_'):
        continue
    
    # 查记录数
    cursor.execute(f"SELECT COUNT(*) FROM '{table_name}'")
    count = cursor.fetchone()[0]
    
    # 查表结构
    cursor.execute(f"PRAGMA table_info('{table_name}')")
    columns = cursor.fetchall()
    
    table_stats.append({
        'name': table_name,
        'count': count,
        'columns': len(columns)
    })

# 分类显示
print("\n📊 所有表统计：")
print("-" * 80)
print(f"{'表名':<30} {'记录数':<10} {'字段数':<10} {'状态':<20}")
print("-" * 80)

empty_tables = []
used_tables = []

for stat in sorted(table_stats, key=lambda x: x['count']):
    status = "🟢 使用中" if stat['count'] > 0 else "🔴 空表"
    print(f"{stat['name']:<30} {stat['count']:<10} {stat['columns']:<10} {status:<20}")
    
    if stat['count'] == 0:
        empty_tables.append(stat['name'])
    else:
        used_tables.append(stat['name'])

print("\n" + "=" * 80)
print(f"🔴 发现 {len(empty_tables)} 个空表（可能没用）：")
print("=" * 80)
for t in empty_tables:
    print(f"  - {t}")

print("\n" + "=" * 80)
print(f"🟢 正在使用的表（{len(used_tables)} 个）：")
print("=" * 80)
for t in used_tables:
    print(f"  - {t}")

print("\n" + "=" * 80)
print("💡 建议：如果确认某些空表确实用不到，可以删除")
print("=" * 80)

conn.close()
