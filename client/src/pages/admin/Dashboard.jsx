import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

export default function AdminDashboard(){
  const { token, API_URL } = useAuth()
  const [stats, setStats] = useState({ totals:{} })
  const [riders, setRiders] = useState([])
  const [packages, setPackages] = useState([])
  const [assign, setAssign] = useState({ trackingId:'', riderId:'' })

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`, { headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json()).then(setStats)
    fetch(`${API_URL}/api/admin/riders`, { headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json()).then(d=>setRiders(d.riders||[]))
    fetch(`${API_URL}/api/admin/packages`, { headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json()).then(d=>setPackages(d.packages||[]))
  }, [token])

  const submitAssign = async (e) => {
    e.preventDefault()
    await fetch(`${API_URL}/api/admin/assign`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(assign) })
    const d = await (await fetch(`${API_URL}/api/admin/packages`, { headers:{ Authorization:`Bearer ${token}` }})).json()
    setPackages(d.packages||[])
  }

  const chartData = packages.slice(0,10).map((p,i)=>({ name: p.trackingId, price: p.price }))

  return (
    <div className="rider-wrap">
      <div className="section-head">
        <h3>Admin Dashboard</h3>
      </div>

      <div className="rider-stats">
        <div className="rider-stat accent-blue">
          <div className="label">Packages</div>
          <div className="value">{stats.totals.packages||0}</div>
        </div>
        <div className="rider-stat accent-green">
          <div className="label">Riders</div>
          <div className="value">{stats.totals.riders||0}</div>
        </div>
        <div className="rider-stat accent-purple">
          <div className="label">Customers</div>
          <div className="value">{stats.totals.customers||0}</div>
        </div>
        <div className="rider-stat accent-orange">
          <div className="label">Revenue</div>
          <div className="value">₹{stats.totals.revenue||0}</div>
        </div>
      </div>

      <div className="section-head">
        <h3>Assign Rider</h3>
      </div>
      <div className="rider-card">
        <form onSubmit={submitAssign} className="row assign-form">
          <input placeholder="Tracking ID" value={assign.trackingId} onChange={e=>setAssign({...assign, trackingId:e.target.value})} />
          <select value={assign.riderId} onChange={e=>setAssign({...assign, riderId:e.target.value})}>
            <option value="">Select rider</option>
            {riders.map(r=> <option key={r._id} value={r._id}>{r.firstName} {r.lastName} ({r.riderId})</option>)}
          </select>
          <button className="btn primary-blue">Assign</button>
        </form>
      </div>

      <div className="section-head">
        <h3>Recent Packages</h3>
        <div className="muted">{packages.length} items</div>
      </div>
      <div className="rider-grid">
        {packages.map(p=> (
          <div className="rider-card" key={p._id}>
            <div className="head">
              <div className="title">{p.trackingId}</div>
              <span className={`badge status ${p.status==='Delivered'?'done':p.status==='In Transit'?'transit':''}`}>{p.status}</span>
            </div>
            <div className="meta">
              Customer: {p.customer?.firstName} {p.customer?.lastName} • Rider: {p.rider ? `${p.rider.firstName} ${p.rider.lastName}` : '-'}
            </div>
            <div className="row">Price: ₹{p.price}</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>Revenue by Package</h3>
      </div>
      <div className="rider-card">
        <div style={{height:300}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide/>
              <YAxis/>
              <Tooltip/>
              <Area type="monotone" dataKey="price" stroke="#8884d8" fillOpacity={1} fill="url(#c)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

