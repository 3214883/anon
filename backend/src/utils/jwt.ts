import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const generateTokenPair = (userId: number): TokenPair => {
  console.log('Generating token pair for userId:', userId);
  
  const accessToken = jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  console.log('Generated access token:', accessToken.substring(0, 30) + '...');
  console.log('Generated refresh token:', refreshToken.substring(0, 30) + '...');
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600
  };
};

export const verifyAccessToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; type?: string };
    // 向后兼容：旧token可能没有type字段，只要有userId就认为有效
    if (decoded.type && decoded.type !== 'access') {
      console.error('Invalid token type: expected access token');
      return null;
    }
    if (decoded.userId === undefined || decoded.userId === null) {
      console.error('Token has no userId');
      return null;
    }
    console.log('Token verified successfully, userId:', decoded.userId);
    return { userId: decoded.userId };
  } catch (error: any) {
    console.error('Access token verification error:', error.message);
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number; type: string };
    if (decoded.type !== 'refresh') {
      console.error('Invalid token type: expected refresh token');
      return null;
    }
    return { userId: decoded.userId };
  } catch (error: any) {
    console.error('Refresh token verification error:', error.message);
    return null;
  }
};

export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
