// 检查并设置超级管理员账号
import fs from 'fs';
import path from 'path';

// 模拟localStorage操作
class LocalStorage {
  constructor() {
    this.storagePath = path.join(process.cwd(), 'localStorage.json');
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        return JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading localStorage:', e);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Error saving localStorage:', e);
    }
  }

  getItem(key) {
    return this.data[key] ? JSON.stringify(this.data[key]) : null;
  }

  setItem(key, value) {
    this.data[key] = typeof value === 'string' ? JSON.parse(value) : value;
    this.save();
  }
}

const localStorage = new LocalStorage();

// 检查是否存在2230053853@qq.com用户
const usersStr = localStorage.getItem('users');
let users = usersStr ? JSON.parse(usersStr) : [];

let targetUser = users.find(user => user.email === '2230053853@qq.com');

if (targetUser) {
  // 如果用户存在，设置为超级管理员
  targetUser.role = 'admin';
  console.log('已将2230053853@qq.com设置为超级管理员');
} else {
  // 如果用户不存在，创建一个新的超级管理员账号
  targetUser = {
    id: users.length + 1,
    name: 'Admin User',
    email: '2230053853@qq.com',
    password: 'admin123', // 默认密码
    role: 'admin'
  };
  users.push(targetUser);
  console.log('已创建2230053853@qq.com超级管理员账号，默认密码：admin123');
}

// 保存回localStorage
localStorage.setItem('users', users);

// 同时更新当前用户（如果是目标用户）
const currentUserStr = localStorage.getItem('user');
if (currentUserStr) {
  const currentUser = JSON.parse(currentUserStr);
  if (currentUser.email === '2230053853@qq.com') {
    currentUser.role = 'admin';
    localStorage.setItem('user', currentUser);
    console.log('已更新当前登录用户为超级管理员');
  }
}

console.log('操作完成！');
console.log('当前用户列表：', users);
