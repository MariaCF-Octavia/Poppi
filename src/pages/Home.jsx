import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

export default function Home({ session }) {
  const [rooms, setRooms] = useState([])
  const [roomPreviews, setRoomPreviews] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomTopic, setRoomTopic] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRooms()
  }, [])

  async function fetchRooms() {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setRooms(data)
      fetchPreviews(data)
    }
  }

  async function fetchPreviews(rooms) {
    const previews = {}
    await Promise.all(rooms.map(async room => {
      const { data } = await supabase
        .from('messages')
        .select('content, profiles(display_name, username)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        previews[room.id] = {
          text: data[0].content,
          name: data[0].profiles?.display_name || data[0].profiles?.username || 'Someone'
        }
      }
    }))
    setRoomPreviews(previews)
  }

  async function createRoom(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('rooms').insert({
      name: roomName,
      topic: roomTopic,
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
      setRoomTopic('')
      navigate(`/room/${data.id}`)
    }
    setLoading(false)
  }

  async function deleteRoom(e, room) {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return
    setDeleting(room.id)
    try {
      // Delete in order: messages first, then members, then room
      const { error: msgErr } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', room.id)
      if (msgErr) console.error('msg delete error:', msgErr)

      const { error: memErr } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', room.id)
      if (memErr) console.error('member delete error:', memErr)

      const { error: roomErr } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id)
      if (roomErr) {
        console.error('room delete error:', roomErr)
        alert('Could not delete room. Make sure the SQL policies were applied in Supabase.')
      } else {
        setRooms(prev => prev.filter(r => r.id !== room.id))
        setRoomPreviews(prev => {
          const next = {...prev}
          delete next[room.id]
          return next
        })
      }
    } finally {
      setDeleting(null)
    }
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

  function getAvatarColor(name) {
    const colors = ['#3d2fa8','#c4425a','#2890f0','#a060f0','#e86898','#28c060','#f08020']
    let hash = 0
    for (let c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.topic || '').toLowerCase().includes(search.toLowerCase())
  )
  const publicRooms = filtered.filter(r => !r.is_private)
  const privateRooms = filtered.filter(r => r.is_private)
  const noResults = search.length > 0 && filtered.length === 0

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>Poppi</div>
        <div style={s.hrow}>
          <button style={s.createBtn} onClick={() => setShowCreate(true)}>+ Room</button>
          <button style={s.outBtn} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <div style={s.searchInner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={s.searchInput}
            placeholder="Search rooms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Start a room</div>
            <form onSubmit={createRoom} style={s.form}>
              <input
                style={s.input}
                placeholder="Room name"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                required
                autoFocus
              />
              <textarea
                style={{...s.input, minHeight:'80px', resize:'vertical', lineHeight:1.5}}
                placeholder="What's this room about? (optional)"
                value={roomTopic}
                onChange={e => setRoomTopic(e.target.value)}
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

      {/* Feed */}
      <div style={s.list}>

        {/* No search results */}
        {noResults && (
          <div style={s.noResults}>
            <div style={{fontSize:'28px', marginBottom:'10px'}}>🔍</div>
            <div style={{fontWeight:'700', marginBottom:'6px'}}>No rooms found for "{search}"</div>
            <div style={{color:'rgba(255,255,255,.35)', fontSize:'13px', marginBottom:'16px'}}>
              This conversation doesn't exist yet.
            </div>
            <button
              style={s.createTopicBtn}
              onClick={() => {
                setRoomName(search)
                setSearch('')
                setShowCreate(true)
              }}
            >
              + Create a room for "{search}"
            </button>
          </div>
        )}

        {publicRooms.length > 0 && (
          <>
            <div style={s.sectionLabel}>
              {search ? `RESULTS` : 'LIVE ROOMS'}
            </div>
            {publicRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              return (
                <div key={room.id} style={{...s.card, opacity: isDeleting ? 0.5 : 1}}>
                  <div
                    style={{...s.cardAv, background: getAvatarColor(room.name)}}
                    onClick={() => joinRoom(room)}
                  >
                    {room.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={s.cardInfo} onClick={() => joinRoom(room)}>
                    <div style={s.cardNameRow}>
                      <div style={s.cardName}>{room.name}</div>
                      <div style={s.liveDot} />
                    </div>
                    {room.topic && (
                      <div style={s.cardTopic}>{room.topic}</div>
                    )}
                    {preview ? (
                      <div style={s.cardPreview}>
                        <span style={s.previewName}>{preview.name}: </span>
                        <span style={s.previewText}>
                          {preview.text.length > 80 ? preview.text.slice(0, 80) + '…' : preview.text}
                        </span>
                      </div>
                    ) : (
                      <div style={s.cardMeta}>Be the first to say something</div>
                    )}
                  </div>
                  {room.owner_id === session.user.id && (
                    <button
                      style={s.deleteBtn}
                      onClick={e => deleteRoom(e, room)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '…' : '✕'}
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}

        {privateRooms.length > 0 && (
          <>
            <div style={{...s.sectionLabel, marginTop:'24px'}}>YOUR PRIVATE ROOMS</div>
            {privateRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              return (
                <div key={room.id} style={{...s.card, borderColor:'rgba(255,255,255,.05)', opacity: isDeleting ? 0.5 : 1}}>
                  <div
                    style={{...s.cardAv, background:'#1a1a1a', border:'1px solid rgba(255,255,255,.1)'}}
                    onClick={() => joinRoom(room)}
                  >
                    🔒
                  </div>
                  <div style={s.cardInfo} onClick={() => joinRoom(room)}>
                    <div style={s.cardNameRow}>
                      <div style={s.cardName}>{room.name}</div>
                    </div>
                    {room.topic && (
                      <div style={s.cardTopic}>{room.topic}</div>
                    )}
                    {preview ? (
                      <div style={s.cardPreview}>
                        <span style={s.previewName}>{preview.name}: </span>
                        <span style={s.previewText}>
                          {preview.text.length > 80 ? preview.text.slice(0, 80) + '…' : preview.text}
                        </span>
                      </div>
                    ) : (
                      <div style={s.cardMeta}>Private · invite only</div>
                    )}
                  </div>
                  {room.owner_id === session.user.id && (
                    <button
                      style={s.deleteBtn}
                      onClick={e => deleteRoom(e, room)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '…' : '✕'}
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}

        {rooms.length === 0 && !search && (
          <div style={s.empty}>
            <div style={{fontSize:'32px', marginBottom:'12px'}}>👋</div>
            <div style={{fontWeight:'700', marginBottom:'6px'}}>No rooms yet</div>
            <div style={{color:'rgba(255,255,255,.35)', fontSize:'14px'}}>Create the first one</div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  wrap: { minHeight:'100vh', background:'#000', color:'#fff', fontFamily:'inherit' },
  header: { padding:'16px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#000', zIndex:10 },
  logo: { fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'900', background:'linear-gradient(135deg,#fff,#e0d0ff,#ffb8cc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  hrow: { display:'flex', gap:'8px' },
  createBtn: { padding:'8px 16px', background:'linear-gradient(135deg,#c02048,#e8547a)', border:'none', borderRadius:'10px', color:'#fff', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  outBtn: { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', color:'rgba(255,255,255,.4)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
  searchWrap: { padding:'12px 16px 8px', position:'sticky', top:'57px', background:'#000', zIndex:9 },
  searchInner: { display:'flex', alignItems:'center', gap:'8px', background:'#111', border:'1px solid rgba(255,255,255,.08)', borderRadius:'12px', padding:'10px 14px' },
  searchInput: { flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:'14px', fontFamily:'inherit' },
  clearBtn: { background:'none', border:'none', color:'rgba(255,255,255,.3)', cursor:'pointer', fontSize:'11px', padding:'0', fontFamily:'inherit' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'20px' },
  modal: { width:'100%', maxWidth:'380px', background:'#111', border:'1px solid rgba(255,255,255,.1)', borderRadius:'18px', padding:'24px' },
  modalTitle: { fontSize:'20px', fontWeight:'700', marginBottom:'20px' },
  form: { display:'flex', flexDirection:'column', gap:'10px' },
  input: { width:'100%', padding:'13px 16px', background:'#1a1a1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', color:'#fff', fontSize:'15px', outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  checkRow: { display:'flex', alignItems:'center', cursor:'pointer' },
  btn: { padding:'14px', background:'linear-gradient(135deg,#c02048,#e8547a)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  cancelBtn: { padding:'13px', background:'transparent', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', color:'rgba(255,255,255,.4)', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' },
  list: { padding:'16px' },
  sectionLabel: { fontSize:'10px', letterSpacing:'.1em', color:'rgba(255,255,255,.28)', marginBottom:'10px', fontFamily:'monospace' },
  noResults: { textAlign:'center', padding:'40px 20px', color:'#fff' },
  createTopicBtn: { padding:'12px 20px', background:'linear-gradient(135deg,#c02048,#e8547a)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  empty: { textAlign:'center', padding:'60px 20px', color:'#fff' },
  card: { display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px', background:'#0a0a0a', border:'1px solid rgba(255,255,255,.08)', borderRadius:'16px', marginBottom:'10px', transition:'opacity .2s' },
  cardAv: { width:'46px', height:'46px', borderRadius:'13px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'800', flexShrink:0, color:'rgba(255,255,255,.9)', cursor:'pointer' },
  cardInfo: { flex:1, minWidth:0, cursor:'pointer' },
  cardNameRow: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' },
  cardName: { fontSize:'15px', fontWeight:'700' },
  liveDot: { width:'7px', height:'7px', borderRadius:'50%', background:'#e8547a', boxShadow:'0 0 6px #e8547a', flexShrink:0 },
  cardTopic: { fontSize:'12px', color:'rgba(255,255,255,.5)', marginBottom:'5px', fontStyle:'italic' },
  cardPreview: { fontSize:'13px', lineHeight:1.4 },
  previewName: { color:'#e8547a', fontWeight:'600' },
  previewText: { color:'rgba(255,255,255,.45)' },
  cardMeta: { fontSize:'12px', color:'rgba(255,255,255,.3)' },
  deleteBtn: { background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', color:'rgba(255,255,255,.3)', width:'28px', height:'28px', borderRadius:'8px', cursor:'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'inherit' },
}