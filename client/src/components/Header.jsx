import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header(){
  const { user, logout } = useAuth()
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    if(next === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
  }
  return (
    <header className="header">
      <div className="brand">
        <span className="inline-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 7.5l9-4 9 4v9l-9 4-9-4v-9zm2 .86v6.94l7 3.11V11.5l-7-3.14zm16 0L14 11.5v6.91l7-3.11V8.36zM12 10.2l6.96-3.06L12 4.24 5.04 7.14 12 10.2z"/>
          </svg>
        </span>
        Track Bee
      </div>
      <nav className="nav">
        <Link to="/">Home</Link>
        {!user && <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </>}
        {user && <>
          {user.role === 'admin' && <Link to="/admin/dashboard">Admin</Link>}
          {user.role === 'rider' && <Link to="/rider/dashboard">Rider</Link>}
          {user.role === 'customer' && <Link to="/customer/dashboard">Customer</Link>}
          <button onClick={logout} className="btn">Sign out</button>
        </>}
        <button className="icon-btn toggle" onClick={toggleTheme} aria-label="Toggle theme">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 1021 12.79z"/>
          </svg>
        </button>
      </nav>
    </header>
  )
}

