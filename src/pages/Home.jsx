import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

const ROOM_CATEGORIES = {
  'Gulf War 3.0':          'Politics',
  "Trump's America":       'Politics',
  'Anthropic Watch':       'Tech',
  'AI Took My Job':        'Tech',
  'No Ring After 4 Years': 'Relationships',
  'The Dating Audit':      'Relationships',
  'The Beauty Tax':        'Culture',
  'The Bondi Files':       'Culture',
  'Gen Z vs Millennials':  'Culture',
  'Stockholm Nights':      'Culture',
  'Creative Block':        'Culture',
  'Founder Life':          'Finance',
  'Money Talks':           'Finance',
  'Side Hustle Season':    'Finance',
}

const ROOM_DESCRIPTIONS = {
  'No Ring After 4 Years':  "She moved in after year one. Two years of living together later — still no proposal. When does patience become self-betrayal? Come in if you've been there, if you're there now, or if you have something honest to say.",
  'Gulf War 3.0':           'The buildup everyone saw coming is here. Civilians are queuing for fuel, the information war is already running, and the geopolitics are messier than 1991. What are you actually watching and what do you think happens next.',
  "Trump's America":        "Family group chats exploding. Friendships ending. A country that can't agree on basic reality. Whether you're inside it or watching from outside — what does it look like from where you are.",
  'Anthropic Watch':        "Claude 4 benchmarks dropped and they're interesting. Extended thinking, real-world performance, the alignment claims nobody else is making. For people who actually use this stuff and want to talk honestly about what it's doing.",
  'AI Took My Job':         "11 years of motion graphics work. £800 a day. Gone in 18 months. This room is for the people living the transition, not theorising about it. What did you lose, what did you find, and what's actually true.",
  'The Beauty Tax':         "£380 a month on what counts as the minimum. Hair, nails, the right kind of groomed. The tax that's invisible until you add it up and then you can't unsee it. What's yours, and are you angry about it.",
  'The Bondi Files':        'Sydney from the inside — not the tourist version. Newcomers figuring it out, locals telling the truth about the city. Coffee, beaches, rent, the 45-minute warmup before Australians let you in.',
  'Gen Z vs Millennials':   'Millennials wrote the thinkpieces and kept working the jobs. Gen Z read them and quit. Is that fair? Is it even the right framing? Or are we all just getting played by the same broken system and arguing about skinny jeans.',
  'Founder Life':           "4 months of runway. 18% MoM growth. The feeling where you're the only one who knows how thin the margin actually is. For founders who want real talk, not LinkedIn inspiration.",
  'Stockholm Nights':       "The 45-minute silence before Swedes decide to be your best friend. Fredagsmys. The best cinnamon bun in the city and where to find it. Life in Stockholm from people who actually live here.",
  'The Dating Audit':       "He confirmed the morning of. Then unmatched an hour before. Eight days of the best conversations she'd had on an app in years. Gone. The apps are doing something to everyone's brain about how disposable people are.",
  'Money Talks':            'Senior engineer. £95k. 6 years. Starting with numbers because salary secrecy only benefits employers. Come in with yours or come in to learn what you\'re worth.',
  'Creative Block':         "Three months of nothing. Every piece feeling hollow before it's finished. A writer whose tank might have run out — or might just be full of grief they haven't looked at yet.",
  'Side Hustle Season':     'First £1k month. ADHD planners, 7 months, 200 reviews, one product doing 60% of revenue. The stuff that actually works when you\'re building on the side.',
}

const CATEGORY_OPTIONS = ['Politics', 'Tech', 'Culture', 'Relationships', 'Finance']

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Home({ session }) {
  const { theme: t } = useTheme()
  const [rooms, setRooms] = useState([])
  const [roomPreviews, setRoomPreviews] = useState({})
  const [roomActivity, setRoomActivity] = useState({})
  const [roomMemberCounts, setRoomMemberCounts] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [previewRoom, setPreviewRoom] = useState(null)
  const [previewStage, setPreviewStage] = useState('about')
  const [previewMessages, setPreviewMessages] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomTopic, setRoomTopic] = useState('')
  const [roomCategory, setRoomCategory] = useState('Culture')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const navigate = useNavigate()

  const filters = ['All', 'Hot', 'Politics', 'Tech', 'Culture', 'Relationships', 'Finance']

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false })
    if (data) { setRooms(data); fetchPreviews(data); fetchMemberCounts(data) }
  }

  async function fetchPreviews(rooms) {
    const previews = {}; const activity = {}
    await Promise.all(rooms.map(async room => {
      const { data } = await supabase.from('messages')
        .select('content, created_at, profiles(display_name, username)')
        .eq('room_id', room.id).order('created_at', { ascending: false }).limit(1)
      if (data && data.length > 0) {
        previews[room.id] = { text: data[0].content, name: data[0].profiles?.display_name || data[0].profiles?.username || 'Someone', time: data[0].created_at }
        activity[room.id] = new Date(data[0].created_at).getTime()
      } else { activity[room.id] = new Date(room.created_at).getTime() }
    }))
    setRoomPreviews(previews); setRoomActivity(activity)
  }

  async function fetchMemberCounts(rooms) {
    const counts = {}
    await Promise.all(rooms.map(async room => {
      const { count } = await supabase.from('room_members').select('*', { count: 'exact', head: true }).eq('room_id', room.id)
      counts[room.id] = count || 0
    }))
    setRoomMemberCounts(counts)
  }

  function openAbout(room, e) { e.stopPropagation(); setPreviewRoom(room); setPreviewStage('about'); setPreviewMessages([]) }

  async function goToConversation() {
    setPreviewStage('conversation')
    if (previewMessages.length > 0) return
    setPreviewLoading(true)
    const { data } = await supabase.from('messages')
      .select('content, created_at, profiles(display_name, username, avatar_url)')
      .eq('room_id', previewRoom.id).order('created_at', { ascending: false }).limit(6)
    setPreviewMessages((data || []).reverse())
    setPreviewLoading(false)
  }

  function closePreview() { setPreviewRoom(null); setPreviewStage('about'); setPreviewMessages([]) }

  async function joinRoom(room) {
    await supabase.from('room_members').upsert({ room_id: room.id, user_id: session.user.id })
    navigate(`/room/${room.id}`)
  }

  function getRoomCategory(room) { return room.category || ROOM_CATEGORIES[room.name] || 'Culture' }
  function getRoomDescription(room) { return ROOM_DESCRIPTIONS[room.name] || room.topic || 'Join the conversation.' }

  function getFilteredRooms() {
    let result = rooms.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.topic || '').toLowerCase().includes(search.toLowerCase())
    )
    if (activeFilter === 'Hot') result = [...result].sort((a, b) => (roomActivity[b.id] || 0) - (roomActivity[a.id] || 0))
    else if (activeFilter !== 'All') result = result.filter(r => getRoomCategory(r) === activeFilter)
    return result
  }

  const filtered = getFilteredRooms()
  const publicRooms = filtered.filter(r => !r.is_private)
  const privateRooms = filtered.filter(r => r.is_private)
  const noResults = filtered.length === 0 && (search.length > 0 || (activeFilter !== 'All' && activeFilter !== 'Hot'))
  const hotRoomIds = [...rooms].sort((a, b) => (roomActivity[b.id] || 0) - (roomActivity[a.id] || 0)).slice(0, 2).map(r => r.id)

  function getSectionLabel() {
    if (search) return 'Results'
    if (activeFilter === 'Hot') return 'Hottest right now'
    if (activeFilter !== 'All') return `${activeFilter} rooms`
    return 'Live rooms'
  }

  async function createRoom(e) {
    e.preventDefault(); setLoading(true)
    const { data, error } = await supabase.from('rooms').insert({
      name: roomName, topic: roomTopic, category: roomCategory, is_private: isPrivate, owner_id: session.user.id,
    }).select().single()
    if (!error && data) {
      await supabase.from('room_members').insert({ room_id: data.id, user_id: session.user.id })
      setShowCreate(false); setRoomName(''); setRoomTopic(''); setRoomCategory('Culture')
      navigate(`/room/${data.id}`)
    }
    setLoading(false)
  }

  async function deleteRoom(e, room) {
    e.stopPropagation(); e.preventDefault()
    if (!confirm(`Delete "${room.name}"?`)) return
    setDeleting(room.id)
    try {
      await supabase.from('messages').delete().eq('room_id', room.id)
      await supabase.from('room_members').delete().eq('room_id', room.id)
      const { error } = await supabase.from('rooms').delete().eq('id', room.id)
      if (!error) {
        setRooms(prev => prev.filter(r => r.id !== room.id))
        setRoomPreviews(prev => { const n = { ...prev }; delete n[room.id]; return n })
      }
    } finally { setDeleting(null) }
  }

  function getInitials(name) { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }
  function getAvatarColor(username) {
    const palette = [t.accent, '#7c2d5e', '#9b1d47', '#2060c0', '#1a7a4a', '#8B4513', '#4B0082']
    let hash = 0; for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  const cat = previewRoom ? getRoomCategory(previewRoom) : 'Culture'

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* HEADER */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: t.bg, zIndex: 10, borderBottom: `1px solid ${t.border}` }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '28px', fontWeight: '700', letterSpacing: '-0.03em', color: t.text, lineHeight: 1 }}>poppi</div>
          <div style={{ fontSize: '11px', color: t.text3 }}>Find your conversation</div>
        </div>
        <button style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${t.border2}`, borderRadius: '10px', color: t.text3, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '12px 16px 8px', position: 'sticky', top: '61px', background: t.bg, zIndex: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '11px 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: '14px', fontFamily: 'inherit' }}
            placeholder="Search rooms or topics..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', fontSize: '11px', padding: 0 }} onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button key={f}
            style={{ padding: '6px 14px', borderRadius: '100px', background: activeFilter === f ? t.pillBg : t.surface, border: `1px solid ${activeFilter === f ? t.accent : t.border}`, color: activeFilter === f ? t.text : t.text3, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
            onClick={() => setActiveFilter(f)}
          >{f}</button>
        ))}
      </div>

      {/* PREVIEW MODAL */}
      {previewRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={closePreview}>
          <div style={{ width: '100%', maxWidth: '500px', background: t.bg2, borderRadius: '24px 24px 0 0', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

            {/* MODAL COVER — img tag approach */}
            <div style={{ position: 'relative', height: '200px', flexShrink: 0, borderRadius: '24px 24px 0 0', overflow: 'hidden', background: `linear-gradient(135deg,${t.surface},${t.surface2})` }}>
              {previewRoom.cover_image && (
                <img src={previewRoom.cover_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,transparent 0%,${t.bg}cc 100%)` }} />
              <button style={{ position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px', borderRadius: '50%', background: `${t.bg}aa`, border: `1px solid ${t.border2}`, color: t.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 2, fontFamily: 'inherit' }} onClick={closePreview}>✕</button>
              <div style={{ position: 'absolute', bottom: '16px', left: '18px', right: '60px', zIndex: 2 }}>
                {previewStage === 'about' && (
                  <>
                    <div style={{ display: 'inline-block', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.accent, background: t.pillBg, border: `1px solid ${t.border2}`, padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{cat}</div>
                    <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '26px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{previewRoom.name}</div>
                  </>
                )}
                {previewStage === 'conversation' && (
                  <>
                    <button style={{ background: 'none', border: 'none', color: t.text2, fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', fontFamily: 'inherit', display: 'block' }} onClick={() => setPreviewStage('about')}>← Back</button>
                    <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '18px', fontWeight: '700', color: t.text }}>{previewRoom.name}</div>
                  </>
                )}
              </div>
            </div>

            {previewStage === 'about' && (
              <div style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: t.pillBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '14px' }}>
                  {[['members', roomMemberCounts[previewRoom.id] || 0], ['status', 'Live'], ['category', cat]].map(([label, val], i) => (
                    <>
                      {i > 0 && <div key={`d${i}`} style={{ width: '1px', height: '28px', background: t.border2 }} />}
                      <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: t.text, fontFamily: "'Playfair Display',serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          {label === 'status' && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.online }} />}
                          {val}
                        </div>
                        <div style={{ fontSize: '9px', color: t.text3, marginTop: '2px', fontFamily: "'Space Mono',monospace" }}>{label}</div>
                      </div>
                    </>
                  ))}
                </div>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '16px' }}>
                  <div style={{ fontSize: '9px', color: t.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: '10px' }}>What's this room about</div>
                  <div style={{ fontSize: '14px', color: t.text2, lineHeight: 1.7 }}>{getRoomDescription(previewRoom)}</div>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'transparent', border: `1px solid ${t.border2}`, borderRadius: '14px', color: t.text, fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }} onClick={goToConversation}>
                  <span>See the conversation</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
                <button style={{ padding: '15px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => joinRoom(previewRoom)}>Jump straight in</button>
                <button style={{ padding: '13px', background: 'transparent', border: 'none', color: t.text3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }} onClick={closePreview}>Maybe later</button>
              </div>
            )}

            {previewStage === 'conversation' && (
              <div style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.online, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: t.text3, fontFamily: "'Space Mono',monospace" }}>Live conversation</span>
                  <span style={{ fontSize: '11px', color: t.text3, opacity: 0.6 }}>— read only until you join</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {previewLoading && <div style={{ fontSize: '13px', color: t.text3, textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>Loading...</div>}
                  {!previewLoading && previewMessages.length === 0 && <div style={{ fontSize: '13px', color: t.text3, textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>No messages yet. Be the first.</div>}
                  {!previewLoading && previewMessages.map((msg, i) => {
                    const name = msg.profiles?.display_name || msg.profiles?.username || 'Someone'
                    return (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: getAvatarColor(msg.profiles?.username), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {msg.profiles?.avatar_url
                            ? <img src={msg.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                            : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: t.text2 }}>{name}</span>
                            <span style={{ fontSize: '9px', color: t.text3, fontFamily: "'Space Mono',monospace" }}>{timeAgo(msg.created_at)}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: t.text2, lineHeight: 1.55 }}>{msg.content}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ height: '40px', background: `linear-gradient(to bottom,transparent,${t.bg2})`, marginTop: '-40px', flexShrink: 0, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: t.text3, textAlign: 'center', fontStyle: 'italic' }}>Join to keep reading and reply</div>
                  <button style={{ padding: '15px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => joinRoom(previewRoom)}>Join the conversation</button>
                  <button style={{ padding: '13px', background: 'transparent', border: 'none', color: t.text3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }} onClick={closePreview}>Maybe later</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '100%', maxWidth: '500px', background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '24px 24px 0 0', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '22px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em', marginBottom: '4px' }}>Create a room</div>
            <div style={{ fontSize: '13px', color: t.text3, marginBottom: '20px' }}>Where do you want to take people?</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {[false, true].map(priv => (
                <div key={String(priv)}
                  style={{ flex: 1, padding: '14px 12px', borderRadius: '14px', background: isPrivate === priv ? t.pillBg : t.surface, border: `1px solid ${isPrivate === priv ? t.accent : t.border}`, cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => setIsPrivate(priv)}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: t.text, marginBottom: '3px' }}>{priv ? '🔒 Private' : '🌐 Public'}</div>
                  <div style={{ fontSize: '11px', color: t.text3, lineHeight: 1.3 }}>{priv ? 'Invite only' : 'Anyone can find and join'}</div>
                </div>
              ))}
            </div>
            <form onSubmit={createRoom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', color: t.text3, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Room name</label>
                <input style={{ width: '100%', padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  placeholder="e.g. Gulf War 3.0" value={roomName} onChange={e => setRoomName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: t.text3, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>What's the story?</label>
                <textarea style={{ width: '100%', padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="What's actually being discussed here." value={roomTopic} onChange={e => setRoomTopic(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: t.text3, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CATEGORY_OPTIONS.map(c => (
                    <button key={c} type="button"
                      style={{ padding: '6px 12px', borderRadius: '100px', background: roomCategory === c ? t.pillBg : t.surface, border: `1px solid ${roomCategory === c ? t.accent : t.border}`, color: roomCategory === c ? t.text : t.text3, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => setRoomCategory(c)}>{c}</button>
                  ))}
                </div>
              </div>
              <button style={{ padding: '14px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create room'}</button>
              <button style={{ padding: '13px', background: 'transparent', border: 'none', color: t.text3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
                type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* FEED */}
      <div style={{ padding: '0 16px' }}>
        {noResults && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: t.text, marginBottom: '6px' }}>{search ? `No rooms for "${search}"` : `No ${activeFilter} rooms yet`}</div>
            <div style={{ fontSize: '13px', color: t.text3, marginBottom: '20px' }}>This conversation doesn't exist yet.</div>
            <button style={{ padding: '14px 24px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => { if (search) setRoomName(search); setSearch(''); setShowCreate(true) }}>Start one</button>
          </div>
        )}

        {publicRooms.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: t.text3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'Space Mono',monospace" }}>
              <span>{getSectionLabel()}</span><div style={{ flex: 1, height: '1px', background: t.border }} />
            </div>
            {publicRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isHot = hotRoomIds.includes(room.id)
              const cat = getRoomCategory(room)
              return (
                <div key={room.id} style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', background: t.surface, border: `1px solid ${t.border}`, cursor: 'pointer', opacity: deleting === room.id ? 0.5 : 1 }}
                  onClick={e => openAbout(room, e)}>

                  {/* ROOM CARD IMAGE — img tag, bulletproof */}
                  <div style={{ position: 'relative', height: '140px', overflow: 'hidden', background: `linear-gradient(135deg,${t.surface},${t.surface2})` }}>
                    {room.cover_image && (
                      <img src={room.cover_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,transparent 0%,${t.bg}99 100%)` }} />
                    {isHot && <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', fontFamily: "'Space Mono',monospace", color: t.hot, background: `${t.bg}bb`, border: `1px solid ${t.hot}55`, padding: '3px 9px', borderRadius: '100px', letterSpacing: '0.06em' }}>🔥 HOT</div>}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.text2, background: `${t.bg}99`, border: `1px solid ${t.border2}`, padding: '3px 9px', borderRadius: '100px', letterSpacing: '0.06em' }}>{cat}</div>
                  </div>

                  <div style={{ padding: '12px 14px 10px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: t.text, fontFamily: "'Playfair Display',Georgia,serif", letterSpacing: '-0.01em', marginBottom: '4px' }}>{room.name}</div>
                    {room.topic && <div style={{ fontSize: '12px', color: t.text3, marginBottom: '6px', lineHeight: 1.4 }}>{room.topic}</div>}
                    {preview
                      ? <div style={{ fontSize: '13px', lineHeight: 1.4, marginBottom: '8px' }}><span style={{ color: t.accent, fontWeight: '600' }}>{preview.name}: </span><span style={{ color: t.text3 }}>{preview.text.length > 80 ? preview.text.slice(0, 80) + '…' : preview.text}</span></div>
                      : <div style={{ fontSize: '12px', color: t.text3, fontStyle: 'italic', marginBottom: '8px' }}>Be the first to say something</div>
                    }
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.online, background: `${t.online}14`, border: `1px solid ${t.online}30`, padding: '3px 8px', borderRadius: '100px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.online }} />LIVE
                      </div>
                      {roomMemberCounts[room.id] > 0 && <div style={{ fontSize: '10px', color: t.text3, fontFamily: "'Space Mono',monospace" }}>{roomMemberCounts[room.id]} members</div>}
                      {room.owner_id === session.user.id && (
                        <button style={{ marginLeft: 'auto', background: t.surface2, border: `1px solid ${t.border}`, color: t.text3, width: '24px', height: '24px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
                          onClick={e => deleteRoom(e, room)}>{deleting === room.id ? '…' : '✕'}</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {privateRooms.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: t.text3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '28px', fontFamily: "'Space Mono',monospace" }}>
              <span>Your private rooms</span><div style={{ flex: 1, height: '1px', background: t.border }} />
            </div>
            {privateRooms.map(room => {
              const preview = roomPreviews[room.id]
              return (
                <div key={room.id} style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', background: t.surface, border: `1px solid ${t.border}`, cursor: 'pointer', opacity: deleting === room.id ? 0.5 : 1 }}
                  onClick={e => openAbout(room, e)}>
                  <div style={{ position: 'relative', height: '100px', background: `linear-gradient(135deg,${t.surface},${t.surface2})` }}>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.text3, padding: '3px 9px' }}>PRIVATE</div>
                  </div>
                  <div style={{ padding: '12px 14px 10px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: t.text, fontFamily: "'Playfair Display',Georgia,serif", marginBottom: '4px' }}>{room.name}</div>
                    {room.topic && <div style={{ fontSize: '12px', color: t.text3, marginBottom: '6px' }}>{room.topic}</div>}
                    {preview ? <div style={{ fontSize: '13px', marginBottom: '8px' }}><span style={{ color: t.accent, fontWeight: '600' }}>{preview.name}: </span><span style={{ color: t.text3 }}>{preview.text.slice(0, 80)}</span></div> : <div style={{ fontSize: '12px', color: t.text3, fontStyle: 'italic', marginBottom: '8px' }}>Invite only</div>}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {room.owner_id === session.user.id && (
                        <button style={{ marginLeft: 'auto', background: t.surface2, border: `1px solid ${t.border}`, color: t.text3, width: '24px', height: '24px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={e => deleteRoom(e, room)}>{deleting === room.id ? '…' : '✕'}</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {rooms.length === 0 && !search && (
          <div style={{ textAlign: 'center', padding: '72px 20px' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: t.text, marginBottom: '6px' }}>No rooms yet</div>
            <div style={{ fontSize: '13px', color: t.text3 }}>Create the first one</div>
          </div>
        )}
        <div style={{ height: '100px' }} />
      </div>

      <BottomNav onCreateRoom={() => setShowCreate(true)} />
    </div>
  )
}