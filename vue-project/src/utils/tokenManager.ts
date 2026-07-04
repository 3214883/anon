import api from '../api';

interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const TOKEN_KEY = 'auth_tokens';
const REFRESH_THRESHOLD = 5 * 60 * 1000;
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export const tokenManager = {
  get isRefreshing() {
    return isRefreshing;
  },

  migrateOldToken() {
    const oldToken = localStorage.getItem('token');
    const newTokens = localStorage.getItem(TOKEN_KEY);

    if (oldToken && !newTokens) {
      console.log('Old token format detected, cannot refresh automatically - please re-login');
      // Old token exists but no new format - clear old data to force fresh login
      // This ensures user gets a proper refresh token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Cleared old authentication data, please login again');
    }
  },

  saveTokens(tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
    const tokenData: TokenStorage = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
    console.log('Tokens saved, expires at:', new Date(tokenData.expiresAt).toLocaleString());
  },

  getTokens(): TokenStorage | null {
    const tokens = localStorage.getItem(TOKEN_KEY);
    if (!tokens) return null;
    try {
      return JSON.parse(tokens);
    } catch (e) {
      console.error('Failed to parse tokens:', e);
      return null;
    }
  },

  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  },

  getRefreshToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.refreshToken || null;
  },

  isTokenExpired(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return true;
    return Date.now() >= tokens.expiresAt;
  },

  isTokenNearExpiry(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return true;
    return Date.now() >= tokens.expiresAt - REFRESH_THRESHOLD;
  },

  async refreshToken(): Promise<boolean> {
    if (isRefreshing) {
      console.log('Refresh already in progress, waiting...');
      await refreshPromise;
      return !this.isTokenExpired();
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken || refreshToken === '') {
      console.log('No valid refresh token available, user needs to re-login');
      return false;
    }

    isRefreshing = true;

    try {
      console.log('Starting token refresh...');

      refreshPromise = api.post('/users/refresh-token', { refreshToken });
      const response = await refreshPromise;

      if (response.success && response.data) {
        this.saveTokens(response.data);
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', response.message);
        this.clearTokens();
        return false;
      }
    } catch (error: any) {
      console.error('Token refresh error:', error.message);
      this.clearTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  },

  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
    console.log('Tokens cleared');
  },

  handleLogout() {
    this.clearTokens();
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }
};

export default tokenManager;
