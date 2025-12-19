import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
        // Log token attachment for debugging (only in dev)
        if (import.meta.env.DEV) {
          console.log('🔑 Attaching token to request:', {
            url: config.url,
            method: config.method,
            tokenPreview: token.substring(0, 20) + '...',
          });
        }
      } else {
        console.warn('⚠️ No token found in auth storage');
      }
    } catch (err) {
      console.error('❌ Error parsing auth storage:', err);
    }
  } else {
    // Only warn if not on public routes
    if (!config.url?.includes('/auth/login') && !config.url?.includes('/auth/register')) {
      console.warn('⚠️ No auth data in localStorage for protected route:', config.url);
    }
  }
  return config;
});

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Session expired. Please login again.';
      
      // Don't clear auth or redirect if we're on signup/login pages (might be registering)
      if (window.location.pathname.includes('/login') || window.location.pathname.includes('/signup')) {
        return Promise.reject(error);
      }
      
      // Log detailed error for debugging
      console.error('❌ 401 Unauthorized Error:', {
        message: errorMessage,
        path: window.location.pathname,
        hasToken: !!localStorage.getItem('auth'),
        errorDetails: error.response?.data,
        requestUrl: error.config?.url,
      });

      // Prevent infinite redirect loops if we are already redirected
      if (window.location.pathname === '/login') {
        return Promise.reject(error);
      }
      
      // Clear auth data
      localStorage.removeItem('auth');
      
      // Show error message in console
      console.error('🔴 Session expired! Redirecting to login page...');
      
      // Use a delay to allow any toast messages to show
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export default api;


