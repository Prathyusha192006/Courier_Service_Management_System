import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Signup(){
  const { register } = useAuth()
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirm:'', role:'customer', adminId:'', riderId:'' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if(form.password !== form.confirm){ setError('Passwords do not match'); return }
    try{
      const payload = { firstName:form.firstName, lastName:form.lastName, email:form.email, phone:form.phone, password:form.password, role:form.role }
      if(form.role==='admin') payload.adminId = form.adminId
      if(form.role==='rider') payload.riderId = form.riderId
      await register(payload)
    }catch(err){ setError(err.message || 'Signup failed') }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card auth">
        <div className="auth-header">
          <h2>Create your account</h2>
          <p className="hint">Sign up to start tracking deliveries in real-time.</p>
        </div>
        {error && <div className="alert danger">{error}</div>}
        <form onSubmit={submit} className="form">
          <label>First Name<input value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} required/></label>
          <label>Last Name<input value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} required/></label>
          <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/></label>
          <label>Phone<input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/></label>
          <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required/></label>
          <label>Confirm Password<input type="password" value={form.confirm} onChange={e=>setForm({...form, confirm:e.target.value})} required/></label>
          <label>Role
            <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
              <option value="admin">Admin</option>
              <option value="rider">Rider</option>
              <option value="customer">Customer</option>
            </select>
          </label>
          {form.role==='admin' && <label>Admin ID<input value={form.adminId} onChange={e=>setForm({...form, adminId:e.target.value})} placeholder="ADMIN001" required/></label>}
          {form.role==='rider' && <label>Rider ID<input value={form.riderId} onChange={e=>setForm({...form, riderId:e.target.value})} placeholder="RIDER001" required/></label>}
          <div className="actions">
            <button className="btn primary-blue" type="submit">Create account</button>
          </div>
        </form>
        <div className="auth-footer">Already have an account? <a href="/login">Sign in</a></div>
      </div>
    </div>
  )
}
