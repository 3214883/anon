import { v4 as uuidv4 } from 'uuid';

// 存储验证码的内存缓存
const codeCache: Record<string, { code: string; expiry: number }> = {};

// 生成4位数字验证码
const generateCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// 发送验证码（模拟）
export const sendVerificationCode = (phone: string): string => {
  // 生成验证码
  const code = generateCode();
  // 设置5分钟过期时间
  const expiry = Date.now() + 5 * 60 * 1000;
  
  // 存储验证码
  codeCache[phone] = { code, expiry };
  
  // 模拟发送短信
  console.log(`向 ${phone} 发送验证码: ${code}`);
  
  return code;
};

// 验证验证码
export const verifyCode = (phone: string, code: string): boolean => {
  const cached = codeCache[phone];
  
  if (!cached) {
    return false;
  }
  
  // 检查是否过期
  if (Date.now() > cached.expiry) {
    delete codeCache[phone];
    return false;
  }
  
  // 检查验证码是否正确
  if (cached.code !== code) {
    return false;
  }
  
  // 验证成功后删除验证码
  delete codeCache[phone];
  return true;
};

// 清除过期的验证码
export const clearExpiredCodes = () => {
  const now = Date.now();
  for (const phone in codeCache) {
    if (codeCache[phone].expiry < now) {
      delete codeCache[phone];
    }
  }
};
