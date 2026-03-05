import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

export default function Room({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [profile, setProfile] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchRoom()
    fetchMessages()
    fetchProfile()

    // Subscribe to new messages in real time
    const channel = supabase
      .channel(`room-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchRoom() {
    const { data } = await supabase.from('rooms').select('*').eq('id', id).single()
    setRoom(data)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select(`*, profiles(username, display_name, avatar_url)`)
      .eq('room_id', id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
  }

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setProfile(data)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    await supabase.from('messages').insert({
      room_id: id,
      user_id: session.user.id,
      content: newMsg.trim()
    })
    setNewMsg('')
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!room) return <div style={{background:'#000',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'white'}}>Loading...</div>

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/')}>←</button>
        <div style={s.roomAv}>{room.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style={s.roomName}>{room.name}</div>
          <div style={s.roomSub}>{room.is_private ? 'Private room' : 'Public room'}</div>
        </div>
        <div style={s.livePill}>Live</div>
      </div>

      {/* Messages */}
      <div style={s.msgs}>
        {messages.map((msg, i) => {
          const isOwn = msg.user_id === session.user.id
          const name = msg.profiles?.display_name || msg.profiles?.username || 'Unknown'
          const initial = name.charAt(0).toUpperCase()
          return (
            <div key={msg.id} style={{...s.msgRow, flexDirection: isOwn ? 'row-reverse' : 'row'}}>
              <div style={s.msgAv}>{initial}</div>
              <div style={{maxWidth:'75%'}}>
                <div style={{...s.msgMeta, justifyContent: isOwn ? 'flex-end' : 'flex-start'}}>
                  <span style={s.msgName}>{isOwn ? 'You' : name}</span>
                  <span style={s.msgTime}>{formatTime(msg.created_at)}</span>
                </div>
                <div style={{...s.bubble, background: isOwn ? 'linear-gradient(135deg,#b81840,#e8547a)' : '#1a1a1a', borderTopLeftRadius: isOwn ? 14 : 3, borderTopRightRadius: isOwn ? 3 : 14}}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <div style={s.empty}>No messages yet. Say something.</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form style={s.inputWrap} onSubmit={sendMessage}>
        <input
          style={s.input}
          placeholder={`Message ${room.name}...`}
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          autoComplete="off"
        />
        <button style={s.sendBtn} type="submit" disabled={!newMsg.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  )
}

const s = {
  wrap: { height:'100vh', display:'flex', flexDirection:'column', background:'#000', color:'#fff' },
  header: { flexShrink:0, padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:'10px' },
  back: { background:'none', border:'none', color:'#e8547a', fontSize:'20px', cursor:'pointer', padding:'4px', lineHeight:1 },
  roomAv: { width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#1a1535,#3d2fa8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', flexShrink:0 },
  roomName: { fontSize:'15px', fontWeight:'700' },
  roomSub: { fontSize:'11px', color:'rgba(255,255,255,.35)' },
  livePill: { marginLeft:'auto', fontSize:'10px', fontWeight:'700', letterSpacing:'.08em', color:'#e8547a', background:'rgba(232,84,122,.12)', border:'1px solid rgba(232,84,122,.25)', padding:'4px 10px', borderRadius:'20px' },
  msgs: { flex:1, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:'12px' },
  msgRow: { display:'flex', gap:'8px', alignItems:'flex-start' },
  msgAv: { width:'30px', height:'30px', borderRadius:'50%', background:'#2a2a2a', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', flexShrink:0 },
  msgMeta: { display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' },
  msgName: { fontSize:'12px', fontWeight:'600' },
  msgTime: { fontSize:'10px', color:'rgba(255,255,255,.3)', fontFamily:'monospace' },
  bubble: { display:'inline-block', padding:'9px 13px', borderRadius:'14px', fontSize:'14px', lineHeight:1.5, color:'#fff' },
  empty: { color:'rgba(255,255,255,.3)', textAlign:'center', marginTop:'40px', fontSize:'14px' },
  inputWrap: { flexShrink:0, padding:'10px 14px 16px', borderTop:'1px solid rgba(255,255,255,.08)', display:'flex', gap:'8px', alignItems:'center' },
  input: { flex:1, background:'#111', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', padding:'12px 16px', color:'#fff', fontSize:'14px', outline:'none', fontFamily:'inherit' },
  sendBtn: { width:'42px', height:'42px', borderRadius:'12px', background:'linear-gradient(135deg,#c02048,#e8547a)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
}