<<<<<<< HEAD
// Holds { user, token }, persists to localStorage. Minimal subset needed for flow 03.
import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
=======
import { createContext, useContext, useState } from 'react'
import api, { getToken } from '../api/client'

const AuthContext = createContext(null)

const storedUser = () => {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser)
  const [token, setToken] = useState(getToken)

  // remember=true -> localStorage (survives browser restart), else sessionStorage
  const login = async ({ email, password, role, remember }) => {
    const { data } = await api.post('/auth/login', { email, password, role })
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('token', data.token)
    storage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem('token')
      s.removeItem('user')
    }
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
