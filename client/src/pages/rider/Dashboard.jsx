import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function RiderDashboard(){
  const { token, API_URL, socket, user } = useAuth()
  const [data, setData] = useState({ deliveries:[], allDeliveries:[], summary:{} })
  const [message, setMessage] = useState('')
  const [watchId, setWatchId] = useState(null)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState('') // trackingId currently updating

  const load = async () => {
    setError('')
    try {
      if (!token) return
      // debug: print identity and API url
      try { console.debug('RiderDashboard load()', { api: `${API_URL}/api/rider/assigned`, userId: user?._id, riderId: user?.riderId }) } catch(_) {}
      const resp = await fetch(`${API_URL}/api/rider/assigned`, { headers:{ Authorization:`Bearer ${token}` }})
      const d = await resp.json()
      // Normalize payload to support both old and new API shapes
      const allDeliveries = Array.isArray(d.allDeliveries) ? d.allDeliveries : (Array.isArray(d.deliveries) ? d.deliveries : [])
      const deliveries = Array.isArray(d.deliveries) ? d.deliveries : allDeliveries.filter(x => x.status !== 'Delivered')
      const summary = d.summary || {
        total: allDeliveries.length,
        delivered: allDeliveries.filter(x => x.status === 'Delivered').length,
        earnings: 0
      }
      const normalized = { deliveries, allDeliveries, summary }
      try { console.debug('Assigned response (normalized)', { deliveries: deliveries.length, allDeliveries: allDeliveries.length, summary }) } catch(_) {}
      setData(normalized)
      // start geowatch if any active delivery present in fresh data
      if((deliveries||[]).some(x => x.status !== 'Delivered')){
        startGeoWatch()
      }
    } catch (e) {
      setError('Failed to load assigned deliveries')
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
    if(!trackingId) return
    setError('')
    setMessage('')
    setUpdating(trackingId)
    try{
      const resp = await fetch(`${API_URL}/api/rider/status`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ trackingId, status })
      })
      const d = await resp.json().catch(()=>({}))
      if(!resp.ok){
        throw new Error(d.message || 'Failed to update status')
      }
      setMessage(status === 'Delivered' ? `Marked ${trackingId} as Delivered` : `Updated ${trackingId} to ${status}`)
      await load()
      if(status === 'In Transit') startGeoWatch()
      if(status === 'Delivered') maybeStopGeoWatch()
    }catch(e){
      setError(e.message || 'Failed to update status')
    }finally{
      setUpdating('')
    }
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

  const activeNotDelivered = (data.deliveries||[]).filter(d => d.status !== 'Delivered')

  return (
    <div className="rider-wrap">
      <div className="section-head">
        <h3>Rider Dashboard</h3>
        <div className="badge">ID: <strong style={{ marginLeft: 4 }}>{user?.riderId || '-'}</strong></div>
        <div className="muted" style={{ marginTop: 6 }}>User _id: <code>{user?._id || '-'}</code></div>
      </div>

      {message && <div className="alert">{message}</div>}
      {error && <div className="alert danger">{error}</div>}

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

      <div className="active-box">
        <div className="section-head">
          <h3>Active Deliveries</h3>
          <div className="muted">{activeNotDelivered.length} active</div>
        </div>
        <div className="rider-grid">
          {activeNotDelivered.length === 0 && <div className="muted">No active deliveries. If you were just assigned, wait a moment or refresh.</div>}
          {activeNotDelivered.map(p => (
          <div className="rider-card" key={p._id}>
            <div className="head">
              <div className="title">{p.trackingId}</div>
              <span className={`badge status ${p.status==='Delivered'?'done':p.status==='In Transit'?'transit':'pending'}`}>{p.status}</span>
            </div>
            <div className="meta">{p.receiver?.name} ({p.receiver?.phone})</div>
            <div className="row">
              {p.receiver?.geo?.lat && <a target="_blank" href={`https://maps.google.com/?q=${p.receiver.geo.lat},${p.receiver.geo.lng}`}>Open Map</a>}
            </div>
            <div className="row">
              <button className="btn sm outline" onClick={startGeoWatch} disabled={!!updating}>Start Location</button>
              <button className="btn sm outline" onClick={maybeStopGeoWatch} disabled={!!updating}>Stop Location</button>
              <button className="btn sm danger" onClick={()=>updateStatus(p.trackingId,'Delivered')} disabled={updating===p.trackingId}>{updating===p.trackingId ? 'Marking…' : 'Mark Delivered'}</button>
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="section-head">
        <h3>All Assigned Deliveries</h3>
        <div className="muted">{(data.allDeliveries||[]).length} total</div>
      </div>
      <div className="rider-grid">
        {(data.allDeliveries||[]).length === 0 && (
          <div className="muted">No deliveries assigned. Ensure the admin assigned to your exact account and the package status is not Delivered.</div>
        )}
        {(data.allDeliveries||[]).map(p => (
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
              <button className="btn sm success" onClick={()=>updateStatus(p.trackingId,'In Transit')} disabled={updating===p.trackingId}>Start</button>
              <button className="btn sm danger" onClick={()=>updateStatus(p.trackingId,'Delivered')} disabled={updating===p.trackingId}>{updating===p.trackingId ? 'Marking…' : 'Mark Delivered'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

