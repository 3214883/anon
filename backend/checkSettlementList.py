import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 70)
print("当前结算列表：")
print("=" * 70)

cursor.execute('''
    SELECT 
        s.id,
        e.title,
        u.username,
        s.totalAmount,
        s.feeAmount,
        s.settleAmount,
        s.status,
        s.createdAt
    FROM settlement s
    LEFT JOIN event e ON s.eventId = e.id
    LEFT JOIN "user" u ON s.organizerId = u.id
    ORDER BY s.createdAt DESC
''')

settlements = cursor.fetchall()
if len(settlements) == 0:
    print('暂无结算记录！正在重新创建...')
    # 如果没有了，重新创建
    cursor.execute('''
        INSERT INTO settlement 
        (eventId, organizerId, totalAmount, participantCount, feeAmount, settleAmount, status, createdAt, updatedAt)
        VALUES (21, 10, 100.00, 1, 0.50, 99.50, 'pending', datetime('now'), datetime('now'))
    ''')
    conn.commit()
    print('✅ 已重新创建结算申请！')
    
    # 再次查询
    cursor.execute('SELECT id, status FROM settlement WHERE eventId = 21')
    print('结算ID:', cursor.fetchone())
else:
    print(f"{'ID':<5} {'活动':<20} {'主办方':<15} {'总金额':<10} {'手续费':<10} {'结算金额':<10} {'状态':<10}")
    print("-" * 70)
    
    for s in settlements:
        s_id, title, username, total, fee, settle, status, created_at = s
        status_text = '待审核' if status == 'pending' else '已通过' if status == 'approved' else '已拒绝'
        print(f"{s_id:<5} {str(title or '')[:19]:<20} {str(username or '')[:14]:<15} ¥{float(total or 0):<9.2f} ¥{float(fee or 0):<9.2f} ¥{float(settle or 0):<9.2f} {status_text:<10}")

conn.close()
print()
print("=" * 70)
print("✅ 请访问 /admin-settlement-review 查看审核界面")
print("   登录账号: 2230053853@qq.com / admin123")
