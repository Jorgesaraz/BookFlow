import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bookflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthRoute = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
        if (!isAuthRoute) {
          localStorage.removeItem('bookflow_token');
          localStorage.removeItem('bookflow_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
