import React from 'react'
import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <div>
      <section className="hero-lite">
        <div className="hero-grid">
          <div>
            
            <h1 className="headline">Deliver Faster with <span className="accent">Track Bee</span></h1>
            <p className="subtle"> Optimize routes, track packages in real‑time, and deliver with the speed and precision of a bee.</p>
            <div className="cta-row">
              <Link className="btn primary-blue" to="/signup">Get Started</Link>
              <Link className="btn white" to="/login">Sign In</Link>
            </div>
          </div>
          <div className="image-card">
            <img alt="Track Bee" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnBKneDqXh74fUZC13UcM_kstAZv63EiP4pA&s"/>
          </div>
        </div>
      </section>
      <section className="grid">
        <div className="card">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDOKpNKLLu9_R6-b0vTDPuCI3_1d9NKaARlg&s" alt="Delivery"/>
          <h3>AI-powered delivery</h3>
          <p>Smart suggestions for routes and pricing. Express options for fastest delivery.</p>
        </div>
        <div className="card">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6m4aFIZR0RWw3W_0CpPn79SCn4n9anFFRHA&s" alt="Tracking"/>
          <h3>Chatbot-assisted tracking</h3>
          <p>Instant support with an AI chatbot for your package updates.</p>
        </div>
        <div className="card">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRryHovB--i4KqHZQX6DhX4Ttcj5Ghw7GA5vg&s" alt="Analytics"/>
          <h3>Predictive analytics</h3>
          <p>Monitor performance with dashboards and charts.</p>
        </div>
        <div className="card">
          <img src="https://tse4.mm.bing.net/th/id/OIP.5h3baOJxXsP2h01cKjgpugHaDy?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Courier"/>
          <h3>Trusted couriers</h3>
          <p>Riders get live routes, check-in/out tracking, and performance metrics.</p>
        </div>
      </section>
    </div>
  )
}
