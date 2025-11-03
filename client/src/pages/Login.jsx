import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login(){
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', role: 'customer', adminId:'', riderId:'' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try{
      await login(form.email, form.password, form.role, { adminId: form.adminId, riderId: form.riderId })
    }catch(err){
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card auth">
        <div className="auth-header">
          <h2>Sign in to Track Bee</h2>
          <p className="hint">Access your dashboard with your role credentials.</p>
        </div>
        {error && <div className="alert danger">{error}</div>}
        <form onSubmit={submit} className="form">
          <label>Email<input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/></label>
          <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required/></label>
          <label>Role
            <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
              <option value="admin">Admin</option>
              <option value="rider">Rider</option>
              <option value="customer">Customer</option>
            </select>
          </label>
          {form.role==='admin' && (
            <label>Admin ID<input value={form.adminId} onChange={e=>setForm({...form, adminId:e.target.value})} required/></label>
          )}
          {form.role==='rider' && (
            <label>Rider ID<input value={form.riderId} onChange={e=>setForm({...form, riderId:e.target.value})} required/></label>
          )}
          <div className="actions">
            <button className="btn primary-blue" type="submit">Sign In</button>
          </div>
        </form>
        <div className="auth-footer">New here? <a href="/signup">Create an account</a></div>
      </div>
    </div>
  )
}
