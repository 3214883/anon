import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 50)
print("当前数据库中的用户:")
print("=" * 50)
cursor.execute('SELECT id, username, email, role, password, isActive FROM "user"')
users = cursor.fetchall()
for user in users:
    print(f"ID: {user[0]}, 用户名: {user[1]}, 邮箱: {user[2]}, 角色: {user[3]}, 密码: {user[4]}, 状态: {user[5]}")

print("\n" + "=" * 50)
print("正在更新/创建管理员账号...")
print("=" * 50)

# 更新 2230053853@qq.com
cursor.execute('''
    UPDATE "user" 
    SET password = ?, role = ?, isActive = ? 
    WHERE email = ?
''', ('admin123', 'admin', 1, '2230053853@qq.com'))

if cursor.rowcount > 0:
    print(f"已更新 2230053853@qq.com 的密码为: admin123")
else:
    # 如果不存在，插入新用户
    cursor.execute('''
        INSERT INTO "user" (username, email, password, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ''', ('杨硕', '2230053853@qq.com', 'admin123', 'admin', 1))
    print(f"已创建管理员账号: 2230053853@qq.com，密码: admin123")

# 也更新默认的 admin@example.com
cursor.execute('''
    UPDATE "user" 
    SET password = ?, role = ?, isActive = ? 
    WHERE email = ?
''', ('admin123', 'admin', 1, 'admin@example.com'))

if cursor.rowcount > 0:
    print(f"已更新 admin@example.com 的密码为: admin123")

conn.commit()

print("\n" + "=" * 50)
print("更新后的用户列表:")
print("=" * 50)
cursor.execute('SELECT id, username, email, role, password, isActive FROM "user"')
users = cursor.fetchall()
for user in users:
    print(f"ID: {user[0]}, 用户名: {user[1]}, 邮箱: {user[2]}, 角色: {user[3]}, 密码: {user[4]}, 状态: {user[5]}")

conn.close()
print("\n操作完成！")
print("\n现在你可以使用以下账号登录:")
print("邮箱: 2230053853@qq.com  密码: admin123")
print("邮箱: admin@example.com  密码: admin123")
