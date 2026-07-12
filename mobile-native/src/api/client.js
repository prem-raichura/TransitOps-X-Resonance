import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// APK runs on a real device — must hit the deployed API, not localhost.
// Override at build time via EXPO_PUBLIC_API_URL (see eas.json).
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://transit-ops-x-resonance-usye.vercel.app/api'

const api = axios.create({ baseURL: BASE_URL })

let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('driverToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const url = err.config?.url || ''
    if (err.response?.status === 401 && !url.includes('/driver-auth/login')) {
      await AsyncStorage.multiRemove(['driverToken', 'driver'])
      onUnauthorized?.()
    }
    return Promise.reject(err)
  },
)

export default api
