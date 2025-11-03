import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AccessDenied(){
  const { user } = useAuth()
  const path = user ? `/${user.role}/dashboard` : '/'
  React.useEffect(() => {
    const t = setTimeout(() => {
      window.location.replace(path)
    }, 2000)
    return () => clearTimeout(t)
  }, [path])
  return (
    <div className="center">
      <h2>Access Denied</h2>
      <p>You do not have permission to view this page.</p>
      <Link className="btn" to={path}>Go back</Link>
    </div>
  )
}
