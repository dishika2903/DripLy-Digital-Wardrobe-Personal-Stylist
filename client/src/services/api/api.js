import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Sends cookies automatically (crucial for refresh tokens)
});

// Access token is held in memory for XSS protection
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request Interceptor: Attach bearer token to header
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401s, fetch refresh token, and retry request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !['/auth/refresh', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'].includes(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to request a new access token via the refresh endpoint
        const response = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });

        if (response.data?.success && response.data?.data?.accessToken) {
          const newAccessToken = response.data.data.accessToken;
          setAccessToken(newAccessToken);

          // Update header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed (cookie expired, missing) -> redirect to login
        setAccessToken(null);
        
        // Only redirect if not already on the login or register pages to avoid infinite reload loops
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
