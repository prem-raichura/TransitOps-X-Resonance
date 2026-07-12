import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api, { setUnauthorizedHandler } from '../api/client'

const DriverAuthContext = createContext(null)

export function DriverAuthProvider({ children }) {
  const [driver, setDriver] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // hydrate persisted session on app start
  useEffect(() => {
    ;(async () => {
      const [t, d] = await Promise.all([AsyncStorage.getItem('driverToken'), AsyncStorage.getItem('driver')])
      if (t) setToken(t)
      if (d) {
        try {
          setDriver(JSON.parse(d))
        } catch {}
      }
      setLoading(false)
    })()
    setUnauthorizedHandler(() => {
      setToken(null)
      setDriver(null)
    })
  }, [])

  const login = async (phone, password) => {
    const { data } = await api.post('/driver-auth/login', { phone, password })
    await AsyncStorage.setItem('driverToken', data.token)
    await AsyncStorage.setItem('driver', JSON.stringify(data.driver))
    setToken(data.token)
    setDriver(data.driver)
    return data.driver
  }

  const logout = async () => {
    await AsyncStorage.multiRemove(['driverToken', 'driver'])
    setToken(null)
    setDriver(null)
  }

  return (
    <DriverAuthContext.Provider value={{ driver, token, loading, login, logout }}>
      {children}
    </DriverAuthContext.Provider>
  )
}

export const useDriverAuth = () => useContext(DriverAuthContext)
