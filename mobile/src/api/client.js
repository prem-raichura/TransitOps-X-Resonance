import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
})

export const getToken = () => localStorage.getItem('driverToken')

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/driver-auth/login')) {
      localStorage.removeItem('driverToken')
      localStorage.removeItem('driver')
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(err)
  },
)

export default api
