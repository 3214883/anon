import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("初始化管理员钱包")
print("=" * 60)

# 查找管理员用户
cursor.execute('SELECT id, username, email FROM "user" WHERE role = "admin"')
admins = cursor.fetchall()

for admin in admins:
    admin_id, username, email = admin
    print(f"\n管理员: {username} ({email})")
    
    # 检查钱包是否存在
    cursor.execute('SELECT id, balance FROM wallet WHERE userId = ?', (admin_id,))
    wallet = cursor.fetchone()
    
    if wallet:
        wallet_id, balance = wallet
        print(f"  钱包已存在，当前余额: ¥{float(balance):.2f}")
    else:
        # 创建钱包
        cursor.execute('''
            INSERT INTO wallet (userId, balance, createdAt, updatedAt)
            VALUES (?, 0, datetime('now'), datetime('now'))
        ''', (admin_id,))
        print(f"  ✅ 已创建管理员钱包，初始余额: ¥0.00")

conn.commit()

print("\n" + "=" * 60)
print("当前所有钱包状态")
print("=" * 60)

cursor.execute('''
    SELECT 
        w.id,
        u.username,
        u.role,
        w.balance
    FROM wallet w
    LEFT JOIN "user" u ON w.userId = u.id
    ORDER BY u.role DESC, w.balance DESC
''')

wallets = cursor.fetchall()
print(f"{'ID':<5} {'用户':<15} {'角色':<10} {'余额':<12}")
print("-" * 60)

for w in wallets:
    w_id, username, role, balance = w
    role_text = '🔴 管理员' if role == 'admin' else '👤 用户'
    print(f"{w_id:<5} {str(username or '')[:14]:<15} {role_text:<10} ¥{float(balance or 0):<11.2f}")

conn.close()
print("\n✅ 完成！管理员钱包已就绪")
