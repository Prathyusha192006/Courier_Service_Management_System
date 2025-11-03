import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const AuthContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [socket, setSocket] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if(token){
      fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }})
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data.user))
        .catch(() => { setUser(null); setToken(''); localStorage.removeItem('token') })
    }
  }, [token])

  useEffect(() => {
    if(token){
      const s = io(API_URL, { auth: { token } })
      setSocket(s)
      return () => s.disconnect()
    }
  }, [token])

  const login = (email, password, role, ids = {}) => {
    const body = { email, password, role }
    if(ids.adminId) body.adminId = ids.adminId
    if(ids.riderId) body.riderId = ids.riderId
    return fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if(!r.ok) throw new Error(data.message || 'Login failed')
        return data
      })
      .then(d => { setToken(d.token); localStorage.setItem('token', d.token); setUser(d.user); navigate(`/${d.user.role}/dashboard`) })
  }

  const register = (payload) => {
    return fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if(!r.ok) throw new Error(data.message || 'Registration failed')
        return data
      })
      .then(d => { setToken(d.token); localStorage.setItem('token', d.token); setUser(d.user); navigate(`/${d.user.role}/dashboard`) })
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, socket, login, register, logout, API_URL }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}
