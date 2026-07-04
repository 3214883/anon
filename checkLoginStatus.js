// 检查登录状态和localStorage内容
console.log('=== 检查登录状态 ===');

// 检查token
const token = localStorage.getItem('token');
console.log('Token:', token);
if (token) {
  console.log('Token 长度:', token.length);
  console.log('Token 前20字符:', token.substring(0, 20) + '...');
} else {
  console.log('没有找到token');
}

// 检查用户信息
const user = localStorage.getItem('user');
console.log('User:', user);
if (user) {
  try {
    const userObj = JSON.parse(user);
    console.log('User ID:', userObj.id);
    console.log('Username:', userObj.username);
    console.log('Email:', userObj.email);
    console.log('Role:', userObj.role);
  } catch (e) {
    console.error('解析用户信息失败:', e);
  }
} else {
  console.log('没有找到用户信息');
}

// 检查所有localStorage键
console.log('\n=== 所有localStorage键 ===');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key + ':', localStorage.getItem(key));
}

// 测试API请求
console.log('\n=== 测试API请求 ===');
fetch('/api/users/me', {
  headers: {
    'Authorization': token ? 'Bearer ' + token : '',
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('API响应状态:', response.status);
  return response.json();
})
.then(data => {
  console.log('API响应数据:', data);
})
.catch(error => {
  console.error('API请求失败:', error);
});
