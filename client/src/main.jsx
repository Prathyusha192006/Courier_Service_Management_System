import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

// Theme init
const savedTheme = localStorage.getItem('theme') || 'dark'
if(savedTheme === 'light') document.documentElement.classList.add('light')

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
