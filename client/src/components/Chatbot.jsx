import React, { useState } from 'react'

export default function Chatbot(){
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ from:'bot', text:'Hi! Ask me about tracking, pricing, or delivery status.' }])
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

  const send = (textOpt) => {
    const text = (textOpt ?? input).trim()
    if(!text) return
    const userMsg = { from:'you', text }
    const lower = text.toLowerCase()
    let reply = "I'm a demo assistant. Try: 'price standard 10km' or 'status TB-XXXX'"
    if(lower.includes('price')) reply = 'Standard base: ₹50 + ₹5/km. Express ~1.4x.'
    if(lower.includes('status')) reply = 'Use the dashboard search with Tracking ID to get live status.'
    if(lower.includes('contact')) reply = 'Support: support@trackbee.local'
    setMessages(prev => [...prev, userMsg, { from:'bot', text: reply }])
    setInput('')
    speak(reply)
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

