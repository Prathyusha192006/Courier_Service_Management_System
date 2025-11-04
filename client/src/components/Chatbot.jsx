import React, { useState } from 'react'

export default function Chatbot(){
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ from:'bot', text:'Welcome to TrackBee! I can guide you. What do you want to do?', suggestions:[
    'Track a package',
    'Check pricing',
    'How to send a package',
    'Account help',
    'Contact support'
  ] }])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = React.useRef(null)
  const inputRef = React.useRef('')
  const endRef = React.useRef(null)
  const voiceGuardRef = React.useRef(false)

  React.useEffect(() => { inputRef.current = input }, [input])

  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if(!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = false // reduce noisy partials
    rec.continuous = false
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      const idx = e.resultIndex
      const res = e.results[idx]
      if(res && res[0]){
        const t = res[0].transcript
        setInput(t)
        const isFinal = (typeof res.isFinal === 'boolean') ? res.isFinal : !!(e.results[idx] && e.results[idx].isFinal)
        if(isFinal && !voiceGuardRef.current){
          // send immediately when final transcript received
          voiceGuardRef.current = true
          setTimeout(() => { send(t); voiceGuardRef.current = false }, 0)
        }
      }
    }
    rec.onend = () => {
      setListening(false)
      const t = (inputRef.current||'').trim()
      if(t && !voiceGuardRef.current) setTimeout(() => send(t), 0)
    }
    rec.onerror = (ev) => {
      setListening(false)
      setMessages(prev => [...prev, { from:'bot', text:`Voice error: ${ev.error || 'unknown'}` }])
    }
    recognitionRef.current = rec
  }, [])

  const speak = (text) => {
    try{
      if('speechSynthesis' in window){
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 1
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(u)
      }
    }catch(_){ /* ignore */ }
  }

  const addBot = (text, suggestions) => ({ from:'bot', text, ...(suggestions ? { suggestions } : {}) })

  const send = (textOpt) => {
    const text = (textOpt ?? input).trim()
    if(!text) return
    const userMsg = { from:'you', text }
    const lower = text.toLowerCase()

    const isTrackingId = /\b(tb[- ]?\d{3,}\b)/i.test(text)

    let botMessages = []

    if(lower === 'track a package' || lower.startsWith('track') || isTrackingId){
      if(isTrackingId){
        botMessages.push(addBot('Opening tracking guidance. Use your dashboard search with this ID for live status. If you are a customer, go to your dashboard > Track.', ['Check pricing', 'Account help', 'Contact support']))
      } else {
        botMessages.push(addBot('Enter your Tracking ID (e.g., TB-1234). I will point you to where to view status.', ['TB-1234', 'TB-5678']))
      }
    } else if(lower.includes('thank')){
      botMessages.push(addBot("You're welcome! Happy to help. Anything else?", [
        'Track a package',
        'Check pricing',
        'How to send a package',
        'Account help'
      ]))
    } else if(lower === 'check pricing' || lower.includes('price') || lower.startsWith('pricing')){
      const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*km/i)
      if(kmMatch){
        const km = parseFloat(kmMatch[1])
        const standard = 50 + 5*km
        const express = Math.round((standard*1.4))
        botMessages.push(addBot(`Estimated pricing for ${km} km: Standard ~ ₹${Math.round(standard)}, Express ~ ₹${express}.` , ['How to send a package', 'Track a package']))
      } else {
        botMessages.push(addBot('Standard: ₹50 base + ₹5/km. Express is ~1.4x. Enter distance like "pricing 10km".', ['pricing 5km', 'pricing 12km']))
      }
    } else if(lower === 'how to send a package' || lower.includes('how to send') || lower.includes('ship')){
      botMessages.push(addBot('Steps: 1) Sign up or log in. 2) Create shipment in your dashboard. 3) Print label. 4) Handover to rider or drop-off.', ['Signup', 'Login', 'Account help']))
    } else if(lower === 'account help' || lower.includes('account') || lower.includes('login') || lower.includes('signup')){
      if(lower.includes('signup')){
        botMessages.push(addBot('Create a new account from the Signup page. After signup, access your dashboard based on your role.', ['Login', 'How to send a package']))
      } else if(lower.includes('login')){
        botMessages.push(addBot('Use the Login page with your credentials. If you forgot your password, use reset on the login screen if available.', ['Signup', 'Track a package']))
      } else {
        botMessages.push(addBot('Account help: You can log in or sign up from the header. Customers, Riders, and Admins have separate dashboards.', ['Login', 'Signup']))
      }
    } else if(lower === 'contact support' || lower.includes('contact') || lower.includes('support')){
      botMessages.push(addBot('Support: support@trackbee.local. Share your Tracking ID and issue details for faster help.', ['Track a package', 'Check pricing']))
    } else if(lower === 'help' || lower === 'menu' || lower.includes('guide')){
      botMessages.push(addBot('Here are some things I can help with:', [
        'Track a package',
        'Check pricing',
        'How to send a package',
        'Account help',
        'Contact support'
      ]))
    } else {
      botMessages.push(addBot("I can guide you with tracking, pricing, how to send, account help, or contacting support.", [
        'Track a package',
        'Check pricing',
        'How to send a package',
        'Account help',
        'Contact support'
      ]))
    }

    const finalBots = botMessages.length ? botMessages : [addBot("Sorry, I didn't catch that.", ['Help'])]
    setMessages(prev => [...prev, userMsg, ...finalBots])
    setInput('')
    const firstReply = finalBots[0]?.text || ''
    if(firstReply) speak(firstReply)
  }

  const toggleMic = () => {
    const rec = recognitionRef.current
    if(!rec) { setMessages(prev=>[...prev, { from:'bot', text:'Voice not supported in this browser.' }]); return }
    if(listening){ try{ rec.stop() }catch(_){}; setListening(false); return }
    try{
      // stop any ongoing speech so mic doesn't capture TTS
      if('speechSynthesis' in window) window.speechSynthesis.cancel()
      rec.start()
      setListening(true)
    }catch(_){ /* could be already started */ }
  }

  return (
    <div>
      <button className="chat-btn" aria-label={open ? 'Close Chat' : 'Open Chat'} onClick={()=>setOpen(!open)}>
        {!open ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
            <path d="M21 15a4 4 0 01-4 4H9l-5 3v-3H5a4 4 0 01-4-4V7a4 4 0 014-4h12a4 4 0 014 4v8z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>Assistant</div>
            <button className="icon-btn" onClick={()=>setOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((m,i)=> (
              <div key={i} className={`chat-bubble ${m.from==='you' ? 'you' : 'bot'}`}>
                <small className="muted">{m.from}</small>
                <div>{m.text}</div>
                {m.from==='bot' && Array.isArray(m.suggestions) && m.suggestions.length>0 && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                    {m.suggestions.map((s,j)=> (
                      <button key={j} className="btn" type="button" onClick={()=>send(s)}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="chat-input" onSubmit={(e)=>{ e.preventDefault(); send(); }}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a message..."/>
            <button type="button" className={`icon-btn ${listening ? 'glow' : ''}`} onClick={toggleMic} aria-label={listening ? 'Stop recording' : 'Start recording'}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19h2v2h-2z"/>
              </svg>
            </button>
            <button type="submit" className="btn primary-blue">Send</button>
          </form>
        </div>
      )}
    </div>
  )
}

