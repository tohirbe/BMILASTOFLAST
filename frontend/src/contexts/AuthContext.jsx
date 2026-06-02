// Global autentifikatsiya holati - token, user, permissions
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authApi.me()
      setUser(data)
      setPermissions(data.permissions || [])
      setMenu(data.menu || [])
    } catch {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const login = async (loginVal, parol) => {
    const { data } = await authApi.login({ login: loginVal, parol })
    localStorage.setItem('token', data.access_token)
    await fetchMe()
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setPermissions([])
    setMenu([])
  }

  const hasPermission = (perm) => permissions.includes(perm)

  return (
    <AuthContext.Provider value={{ user, permissions, menu, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}