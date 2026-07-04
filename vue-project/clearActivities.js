// 清空所有活动相关数据
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

  removeItem(key) {
    delete this.data[key];
    this.save();
  }

  clear() {
    this.data = {};
    this.save();
  }
}

const localStorage = new LocalStorage();

// 清空活动数据
console.log('开始清空活动数据...');

// 1. 清空活动列表
localStorage.removeItem('events');
console.log('✓ 已清空活动列表');

// 2. 清空用户参与的活动和创建的活动
const usersStr = localStorage.getItem('users');
if (usersStr) {
  const users = JSON.parse(usersStr);
  users.forEach(user => {
    const userDataKey = `user_${user.id}`;
    localStorage.removeItem(userDataKey);
    console.log(`✓ 已清空用户 ${user.email} 的活动数据`);
  });
}

// 3. 清空全局的用户参与活动和创建活动数据
localStorage.removeItem('userJoinedEvents');
localStorage.removeItem('userCreatedEvents');
console.log('✓ 已清空全局活动数据');

console.log('\n活动数据清空完成！');
console.log('现在系统中没有任何活动数据，您可以开始创建新的活动了。');
