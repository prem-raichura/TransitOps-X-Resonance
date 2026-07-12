import { createContext, useContext, useState } from 'react'
import api, { getToken } from '../api/client'

const DriverAuthContext = createContext(null)

const storedDriver = () => {
  try {
    const raw = localStorage.getItem('driver')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function DriverAuthProvider({ children }) {
  const [driver, setDriver] = useState(storedDriver)
  const [token, setToken] = useState(getToken)

  const login = async (phone, password) => {
    const { data } = await api.post('/driver-auth/login', { phone, password })
    localStorage.setItem('driverToken', data.token)
    localStorage.setItem('driver', JSON.stringify(data.driver))
    setToken(data.token)
    setDriver(data.driver)
    return data.driver
  }

  const logout = () => {
    localStorage.removeItem('driverToken')
    localStorage.removeItem('driver')
    setToken(null)
    setDriver(null)
  }

  return (
    <DriverAuthContext.Provider value={{ driver, token, login, logout }}>{children}</DriverAuthContext.Provider>
  )
}

export const useDriverAuth = () => useContext(DriverAuthContext)
