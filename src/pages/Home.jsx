import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

export default function Home({ session }) {
  const [rooms, setRooms] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRooms()
  }, [])

  async function fetchRooms() {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRooms(data)
  }

  async function createRoom(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('rooms').insert({
      name: roomName,
      is_private: isPrivate,
      owner_id: session.user.id,
    }).select().single()

    if (!error && data) {
      await supabase.from('room_members').insert({
        room_id: data.id,
        user_id: session.user.id
      })
      setShowCreate(false)
      setRoomName('')
      navigate(`/room/${data.id}`)
    }
    setLoading(false)
  }

  async function joinRoom(room) {
    await supabase.from('room_members').upsert({
      room_id: room.id,
      user_id: session.user.id
    })
    navigate(`/room/${room.id}`)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>Poppi</div>
        <div style={s.hrow}>
          <button style={s.createBtn} onClick={() => setShowCreate(true)}>+ Create room</button>
          <button style={s.outBtn} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Create a room</div>
            <form onSubmit={createRoom} style={s.form}>
              <input
                style={s.input}
                placeholder="Room name"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                required
                autoFocus
              />
              <label style={s.checkRow}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  style={{marginRight:'8px'}}
                />
                <span style={{color:'rgba(255,255,255,.6)', fontSize:'14px'}}>Private room (invite only)</span>
              </label>
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? '...' : 'Create'}
              </button>
              <button style={s.cancelBtn} type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rooms list */}
      <div style={s.list}>
        <div style={s.sectionLabel}>PUBLIC ROOMS</div>
        {rooms.filter(r => !r.is_private).length === 0 && (
          <div style={s.empty}>No public rooms yet. Create the first one.</div>
        )}
        {rooms.filter(r => !r.is_private).map(room => (
          <div key={room.id} style={s.card} onClick={() => joinRoom(room)}>
            <div style={s.cardAv}>{room.name.charAt(0).toUpperCase()}</div>
            <div style={s.cardInfo}>
              <div style={s.cardName}>{room.name}</div>
              <div style={s.cardMeta}>Public room · tap to join</div>
            </div>
            <div style={s.cardArr}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  wrap: { minHeight:'100vh', background:'#000', color:'#fff', fontFamily:'inherit' },
  header: { padding:'16px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo: { fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'900', background:'linear-gradient(135deg,#fff,#e0d0ff,#ffb8cc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  hrow: { display:'flex', gap:'8px' },
  createBtn: { padding:'8px 16px', background:'linear-gradient(135deg,#c02048,#e8547a)', border:'none', borderRadius:'10px', color:'#fff', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  outBtn: { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', color:'rgba(255,255,255,.4)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'20px' },
  modal: { width:'100%', maxWidth:'360px', background:'#111', border:'1px solid rgba(255,255,255,.1)', borderRadius:'18px', padding:'24px' },
  modalTitle: { fontSize:'20px', fontWeight:'700', marginBottom:'20px' },
  form: { display:'flex', flexDirection:'column', gap:'10px' },
  input: { width:'100%', padding:'13px 16px', background:'#1a1a1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', color:'#fff', fontSize:'15px', outline:'none', fontFamily:'inherit' },
  checkRow: { display:'flex', alignItems:'center', cursor:'pointer' },
  btn: { padding:'14px', background:'linear-gradient(135deg,#c02048,#e8547a)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  cancelBtn: { padding:'13px', background:'transparent', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', color:'rgba(255,255,255,.4)', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' },
  list: { padding:'16px' },
  sectionLabel: { fontSize:'10px', letterSpacing:'.1em', color:'rgba(255,255,255,.28)', marginBottom:'10px', fontFamily:'monospace' },
  empty: { color:'rgba(255,255,255,.28)', fontSize:'14px', padding:'20px 0' },
  card: { display:'flex', alignItems:'center', gap:'12px', padding:'14px', background:'#0a0a0a', border:'1px solid rgba(255,255,255,.08)', borderRadius:'14px', marginBottom:'8px', cursor:'pointer', transition:'border-color .15s' },
  cardAv: { width:'44px', height:'44px', borderRadius:'12px', background:'linear-gradient(135deg,#1a1535,#3d2fa8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'800', flexShrink:0 },
  cardInfo: { flex:1 },
  cardName: { fontSize:'15px', fontWeight:'600', marginBottom:'2px' },
  cardMeta: { fontSize:'12px', color:'rgba(255,255,255,.35)' },
  cardArr: { color:'rgba(255,255,255,.2)', fontSize:'18px' },
}