import { verifyToken } from './src/utils/jwt';

// 测试token验证
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsImlhdCI6MTc2MTIzMTg4MCwiZXhwIjoxNzYxMzE4MjgwfQ.3X9X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X';

const decoded = verifyToken(token);
console.log('Decoded token:', decoded);
