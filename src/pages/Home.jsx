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
  'Money Talks':            "Senior engineer. £95k. 6 years. Starting with numbers because salary secrecy only benefits employers. Come in with yours or come in to learn what you're worth.",
  'Creative Block':         "Three months of nothing. Every piece feeling hollow before it's finished. A writer whose tank might have run out — or might just be full of grief they haven't looked at yet.",
  'Side Hustle Season':     "First £1k month. ADHD planners, 7 months, 200 reviews, one product doing 60% of revenue. The stuff that actually works when you're building on the side.",
}

const CATEGORY_OPTIONS = ['Politics', 'Tech', 'Culture', 'Relationships', 'Finance']

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getAvatarColor(username) {
  const palette = ['#c0003a', '#7c2d5e', '#2060c0', '#1a7a4a', '#8B4513', '#4B0082', '#006666']
  let hash = 0
  for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function getInitials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function Home({ session }) {
  const { theme: t } = useTheme()
  const userId = session?.user?.id
  const [rooms, setRooms] = useState([])
  const [roomPreviews, setRoomPreviews] = useState({})
  const [roomActivity, setRoomActivity] = useState({})
  const [roomMemberCounts, setRoomMemberCounts] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [previewRoom, setPreviewRoom] = useState(null)
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
        .select('content, created_at, profiles(display_name, username, avatar_url)')
        .eq('room_id', room.id).order('created_at', { ascending: false }).limit(1)
      if (data && data.length > 0) {
        previews[room.id] = {
          text: data[0].content,
          name: data[0].profiles?.display_name || data[0].profiles?.username || 'Someone',
          username: data[0].profiles?.username || '',
          avatar: data[0].profiles?.avatar_url || null,
          time: data[0].created_at
        }
        activity[room.id] = new Date(data[0].created_at).getTime()
      } else {
        activity[room.id] = new Date(room.created_at).getTime()
      }
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

  async function joinRoom(room) {
    if (!userId) return
    await supabase.from('room_members').upsert({ room_id: room.id, user_id: userId })
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
  const hotRoomId = [...rooms].sort((a, b) => (roomActivity[b.id] || 0) - (roomActivity[a.id] || 0))[0]?.id

  async function createRoom(e) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase.from('rooms').insert({
      name: roomName, topic: roomTopic, category: roomCategory, is_private: isPrivate, owner_id: userId,
    }).select().single()
    if (!error && data) {
      await supabase.from('room_members').insert({ room_id: data.id, user_id: userId })
      setShowCreate(false); setRoomName(''); setRoomTopic(''); setRoomCategory('Culture')
      navigate(`/room/${data.id}`)
    }
    setLoading(false)
  }

  async function deleteRoom(e, room) {
    e.stopPropagation(); e.preventDefault()
    if (!userId) return
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

  async function loadPreviewMessages(room) {
    setPreviewLoading(true)
    const { data } = await supabase.from('messages')
      .select('content, created_at, profiles(display_name, username, avatar_url)')
      .eq('room_id', room.id).order('created_at', { ascending: false }).limit(5)
    setPreviewMessages((data || []).reverse())
    setPreviewLoading(false)
  }

  function openPreview(room, e) {
    e.stopPropagation()
    setPreviewRoom(room)
    setPreviewMessages([])
    loadPreviewMessages(room)
  }

  function closePreview() { setPreviewRoom(null); setPreviewMessages([]) }

  const liveCount = rooms.filter(r => !r.is_private).length

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* HEADER */}
      <div style={{ padding: '20px 16px 0', position: 'sticky', top: 0, background: t.bg, zIndex: 10, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '26px', fontWeight: '700', color: t.text, letterSpacing: '-0.03em', lineHeight: 1 }}>poppi</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.online, background: `${t.online}14`, border: `1px solid ${t.online}30`, padding: '4px 10px', borderRadius: '100px', letterSpacing: '0.06em' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.online, boxShadow: `0 0 5px ${t.online}` }} />
              {liveCount} LIVE
            </div>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono',monospace", fontSize: '10px', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              onClick={() => navigate('/profile')}>
              {getInitials(session?.user?.email?.split('@')[0] || 'Me')}
            </div>
          </div>
        </div>

        {/* FILTER TABS — underline style */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: '0' }}>
          {filters.map(f => (
            <button key={f}
              style={{
                padding: '8px 14px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeFilter === f ? t.accent : 'transparent'}`,
                color: activeFilter === f ? t.text : t.text3,
                fontSize: '11px', fontFamily: "'Space Mono',monospace",
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                marginBottom: '-1px', paddingBottom: '9px',
              }}
              onClick={() => setActiveFilter(f)}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={closePreview}>
          <div style={{ width: '100%', maxWidth: '500px', background: t.bg2, borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {getRoomCategory(previewRoom)}
                </div>
                <button style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', fontSize: '16px', padding: '0 0 0 12px' }} onClick={closePreview}>✕</button>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '10px' }}>{previewRoom.name}</div>
              <div style={{ fontSize: '13px', color: t.text2, lineHeight: 1.65 }}>{getRoomDescription(previewRoom)}</div>
            </div>

            {/* Live conversation preview */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.text3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.online }} />
                Live conversation
              </div>
              {previewLoading && <div style={{ fontSize: '13px', color: t.text3, fontStyle: 'italic' }}>Loading...</div>}
              {!previewLoading && previewMessages.length === 0 && <div style={{ fontSize: '13px', color: t.text3, fontStyle: 'italic' }}>No messages yet. Be the first.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {previewMessages.map((msg, i) => {
                  const name = msg.profiles?.display_name || msg.profiles?.username || 'Someone'
                  return (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: getAvatarColor(msg.profiles?.username), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {msg.profiles?.avatar_url
                          ? <img src={msg.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                          : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', fontWeight: '700', color: 'white' }}>{getInitials(name)}</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: t.text2, marginBottom: '3px' }}>{name}</div>
                        <div style={{ fontSize: '13px', color: t.text2, lineHeight: 1.5 }}>{msg.content}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 20px 36px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{ padding: '15px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => joinRoom(previewRoom)}>Jump in</button>
              <button style={{ padding: '13px', background: 'transparent', border: 'none', color: t.text3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={closePreview}>Maybe later</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '100%', maxWidth: '500px', background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '20px 20px 0 0', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '22px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em', marginBottom: '4px' }}>Start a room</div>
            <div style={{ fontSize: '13px', color: t.text3, marginBottom: '20px' }}>What needs to be talked about?</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {[false, true].map(priv => (
                <div key={String(priv)}
                  style={{ flex: 1, padding: '14px 12px', borderRadius: '12px', background: isPrivate === priv ? t.pillBg : t.surface, border: `1px solid ${isPrivate === priv ? t.accent : t.border}`, cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => setIsPrivate(priv)}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: t.text, marginBottom: '3px' }}>{priv ? 'Private' : 'Public'}</div>
                  <div style={{ fontSize: '11px', color: t.text3 }}>{priv ? 'Invite only' : 'Anyone can join'}</div>
                </div>
              ))}
            </div>
            <form onSubmit={createRoom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input style={{ width: '100%', padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                placeholder="Room name" value={roomName} onChange={e => setRoomName(e.target.value)} required autoFocus />
              <textarea style={{ width: '100%', padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', lineHeight: 1.5 }}
                placeholder="What's the story? Give people a reason to join." value={roomTopic} onChange={e => setRoomTopic(e.target.value)} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORY_OPTIONS.map(c => (
                  <button key={c} type="button"
                    style={{ padding: '6px 12px', borderRadius: '100px', background: roomCategory === c ? t.pillBg : t.surface, border: `1px solid ${roomCategory === c ? t.accent : t.border}`, color: roomCategory === c ? t.text : t.text3, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => setRoomCategory(c)}>{c}</button>
                ))}
              </div>
              <button style={{ padding: '14px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}
                type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create room'}</button>
              <button style={{ padding: '12px', background: 'transparent', border: 'none', color: t.text3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
                type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* FEED */}
      <div style={{ paddingBottom: '100px' }}>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: t.text, marginBottom: '6px' }}>
              {search ? `No rooms for "${search}"` : `No ${activeFilter} rooms yet`}
            </div>
            <div style={{ fontSize: '13px', color: t.text3, marginBottom: '20px' }}>This conversation doesn't exist yet.</div>
            <button style={{ padding: '12px 24px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => { if (search) setRoomName(search); setSearch(''); setShowCreate(true) }}>Start it</button>
          </div>
        )}

        {filtered.filter(r => !r.is_private).map((room, index) => {
          const preview = roomPreviews[room.id]
          const isHot = room.id === hotRoomId
          const isOwner = userId && room.owner_id === userId
          const cat = getRoomCategory(room)

          return (
            <div key={room.id}
              style={{
                borderBottom: `1px solid ${t.border}`,
                borderLeft: isHot ? `3px solid ${t.accent}` : '3px solid transparent',
                cursor: 'pointer',
                opacity: deleting === room.id ? 0.4 : 1,
                background: t.bg,
              }}
              onClick={e => openPreview(room, e)}>

              {/* MAIN CARD CONTENT */}
              <div style={{ padding: '14px 16px 10px', display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* META ROW */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.accent }}>{cat}</span>
                    <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: t.text3, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '9px', color: t.text3, letterSpacing: '0.06em' }}>
                      {roomMemberCounts[room.id] || 0} voices
                    </span>
                    {isHot && (
                      <>
                        <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: t.text3, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '9px', color: '#ff6b35', letterSpacing: '0.06em' }}>🔥 HOT</span>
                      </>
                    )}
                  </div>

                  {/* TITLE */}
                  <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '17px', fontWeight: '700', color: t.text, lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: '6px' }}>
                    {room.name}
                  </div>

                  {/* PULL QUOTE */}
                  {preview ? (
                    <div style={{ fontSize: '13px', color: t.text3, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      <span style={{ color: t.text2, fontWeight: '600' }}>{preview.name}: </span>
                      {preview.text}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: t.text3, fontStyle: 'italic' }}>No messages yet — be the first</div>
                  )}
                </div>
              </div>

              {/* ACTIVITY STRIP */}
              <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Mini avatar */}
                {preview && (
                  <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: getAvatarColor(preview.username), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {preview.avatar
                      ? <img src={preview.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '6px', fontWeight: '700', color: 'white' }}>{getInitials(preview.name)}</span>
                    }
                  </div>
                )}

                <div style={{ fontSize: '11px', color: t.text3, flex: 1 }}>
                  {preview ? (
                    <><span style={{ color: t.text2, fontWeight: '600' }}>{preview.name}</span> just replied</>
                  ) : (
                    <span style={{ fontStyle: 'italic' }}>Start the conversation</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {preview && (
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '9px', color: t.text3 }}>{timeAgo(preview.time)}</span>
                  )}
                  {isOwner && (
                    <button style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text3, width: '22px', height: '22px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => deleteRoom(e, room)}>{deleting === room.id ? '…' : '✕'}</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {rooms.length === 0 && (
          <div style={{ textAlign: 'center', padding: '72px 20px' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: t.text, marginBottom: '6px' }}>No rooms yet</div>
            <div style={{ fontSize: '13px', color: t.text3 }}>Create the first one</div>
          </div>
        )}
      </div>

      <BottomNav onCreateRoom={() => setShowCreate(true)} />
    </div>
  )
}