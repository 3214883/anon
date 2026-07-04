import axios, { type AxiosRequestConfig } from 'axios';
import { tokenManager } from '../utils/tokenManager';
import router from '../router';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('API instance created with baseURL:', api.defaults.baseURL);

// 防止刷新token时重复请求
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Skip token refresh for refresh-token endpoint to prevent infinite loop
    const isRefreshEndpoint = config.url?.includes('/refresh-token');

    // Always migrate old token format before each request
    tokenManager.migrateOldToken();

    if (!isRefreshEndpoint) {
      // Check if token is near expiry and refresh it proactively
      if (tokenManager.isTokenNearExpiry() && !tokenManager.isTokenExpired()) {
        console.log('Token is near expiry, refreshing proactively...');
        try {
          await tokenManager.refreshToken();
        } catch (e) {
          console.error('Proactive token refresh failed:', e);
        }
      }
    }

    // Add token to headers if available
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('Token added to request:', config.url, accessToken.substring(0, 20) + '...');
    } else if (!isRefreshEndpoint) {
      console.log('WARNING: No access token found for request:', config.url);
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response.data?.code;

      // Only attempt refresh for TOKEN_EXPIRED, not for NO_TOKEN
      if (errorCode === 'TOKEN_EXPIRED') {
        originalRequest._retry = true;

        if (tokenManager.isRefreshing) {
          console.log('Token refresh in progress, queuing request');
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        try {
          console.log('Token expired, attempting to refresh...');
          const refreshed = await tokenManager.refreshToken();

          if (refreshed) {
            const newToken = tokenManager.getAccessToken();
            processQueue(null, newToken);

            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          } else {
            processQueue(new Error('Token refresh failed'), null);
            console.log('Token refresh failed, redirecting to login');
            tokenManager.handleLogout();
            router.push('/login');
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          console.error('Token refresh error:', refreshError);
          tokenManager.handleLogout();
          router.push('/login');
          return Promise.reject(refreshError);
        }
      } else if (errorCode === 'NO_TOKEN') {
        // Check if we actually have tokens stored but they weren't sent
        const hasTokens = tokenManager.getAccessToken() || tokenManager.getRefreshToken();
        if (!hasTokens) {
          // Truly no tokens - user needs to login
          console.log('No token available, redirecting to login');
          tokenManager.handleLogout();
          router.push('/login');
        } else {
          // We have tokens but server said NO_TOKEN - might be temporary issue
          console.log('Server reported NO_TOKEN but tokens exist locally - attempting refresh');
          try {
            const refreshed = await tokenManager.refreshToken();
            if (refreshed) {
              const newToken = tokenManager.getAccessToken();
              if (newToken && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return api(originalRequest);
            } else {
              tokenManager.handleLogout();
              router.push('/login');
            }
          } catch {
            tokenManager.handleLogout();
            router.push('/login');
          }
        }
      }
    }

    // Log error details for debugging
    console.error('API Error details:');
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    console.error('Error config:', JSON.stringify({
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    }, null, 2));

    return Promise.reject(error);
  }
);

export default api;
