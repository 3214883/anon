import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 70)
print("检查所有已结束且需要结算的付费活动")
print("=" * 70)

# 查看所有已结束的付费活动及其支付情况
cursor.execute('''
    SELECT 
        e.id,
        e.title,
        e.date,
        e.price,
        e.organizerId,
        (SELECT COUNT(*) FROM payment p WHERE p.eventId = e.id AND p.status = 'completed') as paidCount,
        (SELECT IFNULL(SUM(amount), 0) FROM payment p WHERE p.eventId = e.id AND p.status = 'completed') as totalPaid,
        (SELECT COUNT(*) FROM settlement s WHERE s.eventId = e.id) as hasSettlement
    FROM event e
    WHERE e.price > 0
    ORDER BY e.id DESC
''')

events = cursor.fetchall()

print(f"{'ID':<5} {'活动名称':<25} {'日期':<12} {'价格':<8} {'支付人数':<8} {'总支付':<10} {'已结算':<8}")
print("-" * 70)

need_settlement = []

for e in events:
    event_id, title, date, price, organizer_id, paid_count, total_paid, has_settlement = e
    status = "✅" if has_settlement else "⚠️ 待结算"
    
    print(f"{event_id:<5} {title[:24]:<25} {str(date)[:10]:<12} ¥{price:<7} {paid_count:<8} ¥{total_paid:<9.2f} {status:<8}")
    
    if not has_settlement and paid_count > 0:
        need_settlement.append(e)

print("\n" + "=" * 70)
print(f"发现 {len(need_settlement)} 个已支付但未结算的活动")
print("=" * 70)

# 为这些活动自动创建结算申请
PLATFORM_FEE_RATE = 0.005  # 0.5%

for e in need_settlement:
    event_id, title, date, price, organizer_id, paid_count, total_paid, _ = e
    
    fee_amount = total_paid * PLATFORM_FEE_RATE
    settle_amount = total_paid - fee_amount
    
    print(f"\n正在为活动 '{title}' 创建结算申请...")
    print(f"  总支付: ¥{total_paid:.2f}")
    print(f"  平台手续费(0.5%): ¥{fee_amount:.2f}")
    print(f"  结算金额: ¥{settle_amount:.2f}")
    
    cursor.execute('''
        INSERT INTO settlement 
        (eventId, organizerId, totalAmount, participantCount, feeAmount, settleAmount, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    ''', (event_id, organizer_id, total_paid, paid_count, fee_amount, settle_amount))
    
    print("  ✅ 已创建，进入待审核状态")

conn.commit()

print("\n" + "=" * 70)
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
print(f"{'ID':<5} {'活动':<20} {'主办方':<15} {'总金额':<10} {'手续费':<10} {'结算金额':<10} {'状态':<10}")
print("-" * 70)

for s in settlements:
    s_id, title, username, total, fee, settle, status, created_at = s
    status_text = '待审核' if status == 'pending' else '已通过' if status == 'approved' else '已拒绝'
    print(f"{s_id:<5} {title[:19]:<20} {username[:14]:<15} ¥{total:<9.2f} ¥{fee:<9.2f} ¥{settle:<9.2f} {status_text:<10}")

conn.close()
print("\n✅ 完成！管理员现在可以去审核结算了！")
