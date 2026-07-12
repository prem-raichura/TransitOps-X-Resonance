<<<<<<< HEAD
// Axios instance. Bearer header injected from localStorage; 401 -> clear + redirect to login.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
=======
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
})

export const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token')

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65

api.interceptors.response.use(
  (res) => res,
  (err) => {
<<<<<<< HEAD
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
=======
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
