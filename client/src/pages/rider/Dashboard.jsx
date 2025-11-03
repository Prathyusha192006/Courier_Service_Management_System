import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function RiderDashboard(){
  const { token, API_URL, socket, user } = useAuth()
  const [data, setData] = useState({ deliveries:[], summary:{} })
  const [message, setMessage] = useState('')
  const [watchId, setWatchId] = useState(null)

  const load = async () => {
    const d = await (await fetch(`${API_URL}/api/rider/assigned`, { headers:{ Authorization:`Bearer ${token}` }})).json()
    setData(d)
    if((d.deliveries||[]).some(x => x.status === 'In Transit')){
      startGeoWatch()
    }
  }

  useEffect(() => { load() }, [token])

  useEffect(() => {
    if(!socket) return
    const onAssign = (p) => { setMessage(`New assignment: ${p.trackingId}`); load() }
    socket.on('assignment', onAssign)
    const onAck = (d) => { /* optional ack */ }
    socket.on('rider:location:ack', onAck)
    return () => { socket.off('assignment', onAssign); socket.off('rider:location:ack', onAck) }
  }, [socket])

  const updateStatus = async (trackingId, status) => {
    await fetch(`${API_URL}/api/rider/status`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ trackingId, status }) })
    load()
    if(status === 'In Transit') startGeoWatch()
    if(status === 'Delivered') maybeStopGeoWatch()
  }

  const startGeoWatch = () => {
    if(!navigator.geolocation || !socket) { setMessage('Geolocation not available'); return }
    if(watchId !== null) return
    const id = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng, accuracy, heading, speed } = pos.coords || {}
      if(typeof lat === 'number' && typeof lng === 'number'){
        socket.emit('rider:location', { lat, lng, accuracy, heading, speed })
      }
    }, err => {
      setMessage('Location error')
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 })
    setWatchId(id)
    setMessage('Started location sharing')
  }

  const maybeStopGeoWatch = () => {
    const anyInTransit = (data.deliveries||[]).some(d => d.status === 'In Transit')
    if(!anyInTransit && watchId !== null){
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setMessage('Stopped location sharing')
    }
  }

  useEffect(() => {
    return () => { if(watchId !== null) navigator.geolocation.clearWatch(watchId) }
  }, [watchId])

  const checkIn = async () => { await fetch(`${API_URL}/api/rider/attendance/checkin`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }); load() }
  const checkOut = async () => { await fetch(`${API_URL}/api/rider/attendance/checkout`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }); load() }

  const inTransit = (data.deliveries||[]).filter(d => d.status === 'In Transit')

  return (
    <div className="rider-wrap">
      <div className="section-head">
        <h3>Rider Dashboard</h3>
        <div className="badge">ID: <strong style={{ marginLeft: 4 }}>{user?.riderId || '-'}</strong></div>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="rider-stats">
        <div className="rider-stat accent-blue">
          <div className="label">Total Deliveries</div>
          <div className="value">{data.summary.total||0}</div>
        </div>
        <div className="rider-stat accent-green">
          <div className="label">Delivered</div>
          <div className="value">{data.summary.delivered||0}</div>
        </div>
        <div className="rider-stat accent-purple">
          <div className="label">Earnings</div>
          <div className="value">₹{data.summary.earnings||0}</div>
        </div>
      </div>

      <div className="rider-actions">
        <button className="btn success" onClick={checkIn}>Check-in</button>
        <button className="btn danger" onClick={checkOut}>Check-out</button>
      </div>

      <div className="section-head">
        <h3>Active Deliveries</h3>
        <div className="muted">{inTransit.length} in transit</div>
      </div>
      <div className="rider-grid">
        {inTransit.length === 0 && <div className="muted">No active deliveries in transit.</div>}
        {inTransit.map(p => (
          <div className="rider-card" key={p._id}>
            <div className="head">
              <div className="title">{p.trackingId}</div>
              <span className={`badge status transit`}>In Transit</span>
            </div>
            <div className="meta">{p.receiver?.name} ({p.receiver?.phone})</div>
            <div className="row">
              {p.receiver?.geo?.lat && <a target="_blank" href={`https://maps.google.com/?q=${p.receiver.geo.lat},${p.receiver.geo.lng}`}>Open Map</a>}
            </div>
            <div className="row">
              <button className="btn sm outline" onClick={startGeoWatch}>Start Location</button>
              <button className="btn sm outline" onClick={maybeStopGeoWatch}>Stop Location</button>
              <button className="btn sm danger" onClick={()=>updateStatus(p.trackingId,'Delivered')}>Mark Delivered</button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>All Assigned Deliveries</h3>
        <div className="muted">{(data.deliveries||[]).length} total</div>
      </div>
      <div className="rider-grid">
        {(data.deliveries||[]).map(p => (
          <div className="rider-card" key={p._id}>
            <div className="head">
              <div className="title">{p.trackingId}</div>
              <span className={`badge status ${p.status==='Delivered'?'done':p.status==='In Transit'?'transit':''}`}>{p.status}</span>
            </div>
            <div className="meta">{p.receiver?.name} ({p.receiver?.phone})</div>
            <div className="row">
              {p.receiver?.geo?.lat && <a target="_blank" href={`https://maps.google.com/?q=${p.receiver.geo.lat},${p.receiver.geo.lng}`}>Open Map</a>}
            </div>
            <div className="row">
              <button className="btn sm success" onClick={()=>updateStatus(p.trackingId,'In Transit')}>Start</button>
              <button className="btn sm danger" onClick={()=>updateStatus(p.trackingId,'Delivered')}>Mark Delivered</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

