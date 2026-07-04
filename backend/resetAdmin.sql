-- 查看所有用户
SELECT id, username, email, role, password, isActive FROM "user";

-- 更新 2230053853@qq.com 的密码
UPDATE "user" SET password = 'admin123', role = 'admin', isActive = 1 WHERE email = '2230053853@qq.com';

-- 更新 admin@example.com 的密码
UPDATE "user" SET password = 'admin123', role = 'admin', isActive = 1 WHERE email = 'admin@example.com';

-- 如果管理员不存在，插入新的管理员
INSERT OR IGNORE INTO "user" (username, email, password, role, isActive, "createdAt", "updatedAt")
VALUES ('杨硕', '2230053853@qq.com', 'admin123', 'admin', 1, datetime('now'), datetime('now'));

-- 再次查看确认
SELECT id, username, email, role, password, isActive FROM "user";
