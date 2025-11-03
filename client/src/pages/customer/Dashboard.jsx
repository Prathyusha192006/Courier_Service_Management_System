import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function CustomerDashboard(){
  const { token, API_URL, socket } = useAuth()
  const [shipments, setShipments] = useState([])
  const [tracking, setTracking] = useState('')
  const [found, setFound] = useState(null)
  const [form, setForm] = useState({ sender:{ name:'', address:'', phone:'', geo:{ lat:'', lng:'' } }, receiver:{ name:'', address:'', phone:'', geo:{ lat:'', lng:'' } }, type:'standard', extraPaid:0 })
  const [error, setError] = useState('')

  const load = async () => {
    const d = await (await fetch(`${API_URL}/api/customer/shipments`, { headers:{ Authorization:`Bearer ${token}` }})).json()
    setShipments(d.shipments||[])
  }
  useEffect(()=>{ load() }, [token])

  useEffect(()=>{
    if(!socket) return
    const onUpdate = (p) => { if(found && p.trackingId===found.trackingId) setFound(prev=>({ ...prev, status: p.status })) ; load() }
    socket.on('package:update', onUpdate)
    const onLocation = (p) => {
      if(found && p.trackingId === found.trackingId){
        setFound(prev => ({ ...prev, lastLocation: { lat: p.lat, lng: p.lng, at: p.at, accuracy: p.accuracy } }))
      }
    }
    socket.on('package:location', onLocation)
    return ()=> { socket.off('package:update', onUpdate); socket.off('package:location', onLocation) }
  }, [socket, found])

  const search = async () => {
    if(!tracking) return
    const r = await fetch(`${API_URL}/api/customer/track/${tracking}`, { headers:{ Authorization:`Bearer ${token}` }})
    if(r.ok){ const d = await r.json(); setFound(d.pkg) } else { setFound(null) }
  }

  const create = async (e) => {
    e.preventDefault()
    setError('')
    const payload = JSON.parse(JSON.stringify(form))
    // Client-side validation
    const required = [
      payload.sender.name,
      payload.sender.address,
      payload.sender.phone,
      payload.receiver.name,
      payload.receiver.address,
      payload.receiver.phone,
      payload.sender.geo.lat,
      payload.sender.geo.lng,
      payload.receiver.geo.lat,
      payload.receiver.geo.lng,
    ]
    if(required.some(v => v === '' || v === null || v === undefined)){
      setError('Please fill all sender/receiver details and coordinates.');
      return
    }
    payload.sender.geo.lat = Number(payload.sender.geo.lat); payload.sender.geo.lng = Number(payload.sender.geo.lng)
    payload.receiver.geo.lat = Number(payload.receiver.geo.lat); payload.receiver.geo.lng = Number(payload.receiver.geo.lng)
    if([payload.sender.geo.lat, payload.sender.geo.lng, payload.receiver.geo.lat, payload.receiver.geo.lng].some(n => Number.isNaN(n))){
      setError('Latitude and Longitude must be numbers.');
      return
    }
    const r = await fetch(`${API_URL}/api/customer/shipments`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) })
    const d = await r.json()
    if(!r.ok){ setError(d.message || 'Failed to create shipment'); return }
    setShipments([d.pkg, ...shipments])
  }

  const showLive = (s) => {
    if(!s) return
    setTracking(s.trackingId)
    setFound(s)
  }

  return (
    <div className="customer-wrap">
      <h2>Customer Dashboard</h2>
      {error && <div className="alert danger">{error}</div>}
      <div className="panel">
        <h3>Track Package</h3>
        <div className="row customer-track">
          <input placeholder="Tracking ID" value={tracking} onChange={e=>setTracking(e.target.value)} />
          <button className="btn primary-blue" onClick={search}>Search</button>
        </div>
        {found && (
          <div className="alert">
            {found.trackingId} — <span className={`badge ${found.status==='Delivered'?'success':found.status==='In Transit'?'warn':''}`}>{found.status}</span>
            {found.lastLocation && (
              <div style={{ marginTop: 8 }}>
                Live location: {found.lastLocation.lat?.toFixed?.(5)}, {found.lastLocation.lng?.toFixed?.(5)}
                {' '}<a target="_blank" href={`https://maps.google.com/?q=${found.lastLocation.lat},${found.lastLocation.lng}`}>Open Map</a>
                <div style={{ marginTop: 8 }}>
                  <iframe
                    title="live-map"
                    width="100%"
                    height="260"
                    style={{ border: 0, borderRadius: 8 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${found.lastLocation.lat},${found.lastLocation.lng}&z=15&output=embed`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Create Shipment</h3>
        <form onSubmit={create} className="grid2 customer-form">
          <div>
            <h4>Sender</h4>
            <input placeholder="Name" value={form.sender.name} onChange={e=>setForm({...form, sender:{...form.sender, name:e.target.value}})} required />
            <input placeholder="Address" value={form.sender.address} onChange={e=>setForm({...form, sender:{...form.sender, address:e.target.value}})} required />
            <input placeholder="Phone" value={form.sender.phone} onChange={e=>setForm({...form, sender:{...form.sender, phone:e.target.value}})} required />
            <div className="row">
              <input placeholder="Lat" value={form.sender.geo.lat} onChange={e=>setForm({...form, sender:{...form.sender, geo:{...form.sender.geo, lat:e.target.value}}})} required />
              <input placeholder="Lng" value={form.sender.geo.lng} onChange={e=>setForm({...form, sender:{...form.sender, geo:{...form.sender.geo, lng:e.target.value}}})} required />
            </div>
          </div>
          <div>
            <h4>Receiver</h4>
            <input placeholder="Name" value={form.receiver.name} onChange={e=>setForm({...form, receiver:{...form.receiver, name:e.target.value}})} required />
            <input placeholder="Address" value={form.receiver.address} onChange={e=>setForm({...form, receiver:{...form.receiver, address:e.target.value}})} required />
            <input placeholder="Phone" value={form.receiver.phone} onChange={e=>setForm({...form, receiver:{...form.receiver, phone:e.target.value}})} required />
            <div className="row">
              <input placeholder="Lat" value={form.receiver.geo.lat} onChange={e=>setForm({...form, receiver:{...form.receiver, geo:{...form.receiver.geo, lat:e.target.value}}})} required />
              <input placeholder="Lng" value={form.receiver.geo.lng} onChange={e=>setForm({...form, receiver:{...form.receiver, geo:{...form.receiver.geo, lng:e.target.value}}})} required />
            </div>
          </div>
          <div className="row">
            <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
            <input type="number" placeholder="Extra for fastest" value={form.extraPaid} onChange={e=>setForm({...form, extraPaid:e.target.value})} />
          </div>
          <button className="btn primary-blue">Create</button>
        </form>
      </div>

      <div className="panel">
        <h3>Your Packages</h3>
        <div className="table-wrap">
          <div className="table">
            <div className="thead"><div>Tracking</div><div>Status</div><div>Type</div><div>Price</div><div>Live</div></div>
            {shipments.map(s=> (
              <div className="trow" key={s._id}>
                <div>{s.trackingId}</div>
                <div><span className={`badge ${s.status==='Delivered'?'success':s.status==='In Transit'?'warn':''}`}>{s.status}</span></div>
                <div>{s.type}</div>
                <div>₹{s.price}</div>
                <div className="row">
                  <button className="btn sm outline" onClick={()=>showLive(s)}>Live</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Reports</h3>
        <p>View delivery history and totals.</p>
        <div>Total deliveries: {shipments.length}</div>
        <div>Delivered: {shipments.filter(s=>s.status==='Delivered').length}</div>
      </div>
    </div>
  )
}
