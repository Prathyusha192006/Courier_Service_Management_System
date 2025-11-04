import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const AuthContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000')

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch(_) { return null }
  })
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        if(!token){ setLoading(false); return }
        const resp = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }})
        if(resp.ok){
          const data = await resp.json().catch(()=>({}))
          if(!cancelled){ setUser(data.user); localStorage.setItem('user', JSON.stringify(data.user||null)) }
        } else {
          // only clear on explicit 401
          if(resp.status === 401){
            if(!cancelled){ setUser(null); setToken(''); localStorage.removeItem('token'); localStorage.removeItem('user') }
          }
        }
      } catch (_) {
        // network error: keep existing token/user, do not force logout
      } finally {
        if(!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if(token){
      const s = io(API_URL, { auth: { token } })
      setSocket(s)
      return () => s.disconnect()
    }
  }, [token])

  const login = (email, password, role, ids = {}) => {
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanAdminId = (ids.adminId || '').trim()
    const cleanRiderId = (ids.riderId || '').trim()
    const body = { email: cleanEmail, password }
    if(cleanAdminId) body.adminId = cleanAdminId
    if(cleanRiderId) body.riderId = cleanRiderId
    return fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if(!r.ok) throw new Error(data.message || 'Login failed')
        return data
      })
      .then(d => { setToken(d.token); localStorage.setItem('token', d.token); setUser(d.user); localStorage.setItem('user', JSON.stringify(d.user||null)); navigate(`/${d.user.role}/dashboard`) })
  }

  const register = (payload) => {
    return fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if(!r.ok) throw new Error(data.message || 'Registration failed')
        return data
      })
      .then(d => { setToken(d.token); localStorage.setItem('token', d.token); setUser(d.user); localStorage.setItem('user', JSON.stringify(d.user||null)); navigate(`/${d.user.role}/dashboard`) })
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, socket, login, register, logout, API_URL, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}
