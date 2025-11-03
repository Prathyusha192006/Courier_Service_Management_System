import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/admin/Dashboard'
import RiderDashboard from './pages/rider/Dashboard'
import CustomerDashboard from './pages/customer/Dashboard'
import AccessDenied from './pages/AccessDenied'

function App(){
  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/signup" element={<Signup/>} />
            <Route path="/denied" element={<AccessDenied/>} />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={["admin"]}><AdminDashboard/></ProtectedRoute>
            } />
            <Route path="/rider/dashboard" element={
              <ProtectedRoute roles={["rider"]}><RiderDashboard/></ProtectedRoute>
            } />
            <Route path="/customer/dashboard" element={
              <ProtectedRoute roles={["customer"]}><CustomerDashboard/></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Chatbot />
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App
