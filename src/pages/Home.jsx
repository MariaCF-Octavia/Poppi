import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

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

// Gradient fallbacks for rooms without cover images
const CATEGORY_GRADIENTS = {
  Politics:      'linear-gradient(135deg, #1a0010, #3d0020)',
  Tech:          'linear-gradient(135deg, #001a2e, #003d5c)',
  Culture:       'linear-gradient(135deg, #1a0018, #3d0040)',
  Relationships: 'linear-gradient(135deg, #1a0008, #3d0018)',
  Finance:       'linear-gradient(135deg, #0a1a00, #1a3d00)',
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
    const { data } = await supabase
      .from('rooms').select('*').order('created_at', { ascending: false })
    if (data) {
      setRooms(data)
      fetchPreviews(data)
      fetchMemberCounts(data)
    }
  }

  async function fetchPreviews(rooms) {
    const previews = {}
    const activity = {}
    await Promise.all(rooms.map(async room => {
      const { data } = await supabase
        .from('messages')
        .select('content, created_at, profiles(display_name, username)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        previews[room.id] = {
          text: data[0].content,
          name: data[0].profiles?.display_name || data[0].profiles?.username || 'Someone',
          time: data[0].created_at,
        }
        activity[room.id] = new Date(data[0].created_at).getTime()
      } else {
        activity[room.id] = new Date(room.created_at).getTime()
      }
    }))
    setRoomPreviews(previews)
    setRoomActivity(activity)
  }

  async function fetchMemberCounts(rooms) {
    const counts = {}
    await Promise.all(rooms.map(async room => {
      const { count } = await supabase
        .from('room_members').select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
      counts[room.id] = count || 0
    }))
    setRoomMemberCounts(counts)
  }

  async function openPreview(room, e) {
    e.stopPropagation()
    setPreviewRoom(room)
    setPreviewLoading(true)
    setPreviewMessages([])
    const { data } = await supabase
      .from('messages')
      .select('content, created_at, profiles(display_name, username, avatar_url)')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })
      .limit(4)
    setPreviewMessages((data || []).reverse())
    setPreviewLoading(false)
  }

  async function joinRoom(room) {
    await supabase.from('room_members').upsert({ room_id: room.id, user_id: session.user.id })
    navigate(`/room/${room.id}`)
  }

  function getRoomCategory(room) {
    return room.category || ROOM_CATEGORIES[room.name] || 'Culture'
  }

  function getFilteredRooms() {
    let result = rooms.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.topic || '').toLowerCase().includes(search.toLowerCase())
    )
    if (activeFilter === 'Hot') {
      result = [...result].sort((a, b) => (roomActivity[b.id] || 0) - (roomActivity[a.id] || 0))
    } else if (activeFilter !== 'All') {
      result = result.filter(r => getRoomCategory(r) === activeFilter)
    }
    return result
  }

  const filtered = getFilteredRooms()
  const publicRooms = filtered.filter(r => !r.is_private)
  const privateRooms = filtered.filter(r => r.is_private)
  const noResults = filtered.length === 0 && (search.length > 0 || (activeFilter !== 'All' && activeFilter !== 'Hot'))

  const hotRoomIds = [...rooms]
    .sort((a, b) => (roomActivity[b.id] || 0) - (roomActivity[a.id] || 0))
    .slice(0, 2).map(r => r.id)

  function getSectionLabel() {
    if (search) return 'Results'
    if (activeFilter === 'Hot') return 'Hottest right now'
    if (activeFilter !== 'All') return `${activeFilter} rooms`
    return 'Live rooms'
  }

  async function createRoom(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('rooms').insert({
      name: roomName, topic: roomTopic, category: roomCategory,
      is_private: isPrivate, owner_id: session.user.id,
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
        setRoomPreviews(prev => { const n = {...prev}; delete n[room.id]; return n })
      }
    } finally { setDeleting(null) }
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  function getAvatarColor(username) {
    const palette = ['#c0003a','#7c2d5e','#9b1d47','#2060c0','#1a7a4a','#8B4513','#4B0082']
    let hash = 0
    for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  return (
    <div style={s.wrap}>

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logoWrap}>
          <div style={s.logo}>poppi</div>
          <div style={s.logoSub}>Find your conversation</div>
        </div>
        <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>

      {/* SEARCH */}
      <div style={s.searchWrap}>
        <div style={s.searchInner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,224,234,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={s.searchInput} placeholder="Search rooms or topics..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {/* FILTERS */}
      <div style={s.filterRow}>
        {filters.map(f => (
          <button key={f}
            style={{...s.filterChip, ...(activeFilter === f ? s.filterChipActive : {})}}
            onClick={() => setActiveFilter(f)}
          >{f}</button>
        ))}
      </div>

      {/* ROOM PREVIEW MODAL */}
      {previewRoom && (
        <div style={s.overlay} onClick={() => setPreviewRoom(null)}>
          <div style={s.previewModal} onClick={e => e.stopPropagation()}>

            {/* Cover image hero */}
            <div style={{
              ...s.previewHero,
              backgroundImage: previewRoom.cover_image ? `url(${previewRoom.cover_image})` : undefined,
              background: previewRoom.cover_image ? undefined : (CATEGORY_GRADIENTS[getRoomCategory(previewRoom)] || CATEGORY_GRADIENTS.Culture),
            }}>
              <div style={s.previewHeroOverlay} />
              <button style={s.previewClose} onClick={() => setPreviewRoom(null)}>✕</button>
              <div style={s.previewHeroContent}>
                <div style={s.previewCatPill}>{getRoomCategory(previewRoom)}</div>
                <div style={s.previewRoomName}>{previewRoom.name}</div>
                {previewRoom.topic && <div style={s.previewRoomTopic}>{previewRoom.topic}</div>}
              </div>
            </div>

            <div style={s.previewBody}>
              {/* Stats row */}
              <div style={s.previewStats}>
                <div style={s.previewStat}>
                  <div style={s.previewStatNum}>{roomMemberCounts[previewRoom.id] || 0}</div>
                  <div style={s.previewStatLabel}>members</div>
                </div>
                <div style={s.previewStatDivider} />
                <div style={s.previewStat}>
                  <div style={{...s.previewStatNum, display:'flex', alignItems:'center', gap:'5px'}}>
                    <div style={{width:'7px', height:'7px', borderRadius:'50%', background:'#4ade80'}} />
                    Live
                  </div>
                  <div style={s.previewStatLabel}>right now</div>
                </div>
                <div style={s.previewStatDivider} />
                <div style={s.previewStat}>
                  <div style={s.previewStatNum}>{previewMessages.length}</div>
                  <div style={s.previewStatLabel}>recent msgs</div>
                </div>
              </div>

              {/* Live conversation preview */}
              <div style={s.previewMsgsLabel}>Live conversation</div>
              <div style={s.previewMsgs}>
                {previewLoading && <div style={s.previewEmpty}>Loading...</div>}
                {!previewLoading && previewMessages.length === 0 && (
                  <div style={s.previewEmpty}>No messages yet. Be the first.</div>
                )}
                {!previewLoading && previewMessages.map((msg, i) => {
                  const name = msg.profiles?.display_name || msg.profiles?.username || 'Someone'
                  const username = msg.profiles?.username || ''
                  const avatarUrl = msg.profiles?.avatar_url
                  return (
                    <div key={i} style={s.previewMsg}>
                      <div style={{...s.previewMsgAv, background: getAvatarColor(username)}}>
                        {avatarUrl
                          ? <img src={avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name} />
                          : <span style={s.previewMsgAvText}>{getInitials(name)}</span>
                        }
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={s.previewMsgMeta}>
                          <span style={s.previewMsgName}>{name}</span>
                          <span style={s.previewMsgTime}>{timeAgo(msg.created_at)}</span>
                        </div>
                        <div style={s.previewMsgText}>{msg.content}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <button style={s.joinBtn} onClick={() => joinRoom(previewRoom)}>
                Join the conversation
              </button>
              <button style={s.cancelBtn} onClick={() => setPreviewRoom(null)}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Create a room</div>
              <div style={s.modalSub}>Where do you want to take people?</div>
            </div>
            <div style={s.typeRow}>
              {[false, true].map(priv => (
                <div key={String(priv)}
                  style={{...s.typeCard, ...(isPrivate === priv ? s.typeCardActive : {})}}
                  onClick={() => setIsPrivate(priv)}
                >
                  <div style={s.typeLabel}>{priv ? 'Private' : 'Public'}</div>
                  <div style={s.typeDesc}>{priv ? 'Invite only' : 'Anyone can find and join'}</div>
                </div>
              ))}
            </div>
            <form onSubmit={createRoom} style={s.form}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Room name</label>
                <input style={s.input} placeholder="e.g. Gulf War 3.0" value={roomName} onChange={e => setRoomName(e.target.value)} required autoFocus />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>What's this room about?</label>
                <textarea style={{...s.input, minHeight:'72px', resize:'vertical', lineHeight:1.5}} placeholder="The topic or theme" value={roomTopic} onChange={e => setRoomTopic(e.target.value)} />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Category</label>
                <div style={s.categoryRow}>
                  {CATEGORY_OPTIONS.map(cat => (
                    <button key={cat} type="button"
                      style={{...s.catChip, ...(roomCategory === cat ? s.catChipActive : {})}}
                      onClick={() => setRoomCategory(cat)}
                    >{cat}</button>
                  ))}
                </div>
              </div>
              <button style={s.submitBtn} type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create room'}</button>
              <button style={s.cancelBtn} type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* FEED */}
      <div style={s.list}>
        {noResults && (
          <div style={s.noResults}>
            <div style={s.noResultsTitle}>{search ? `No rooms for "${search}"` : `No ${activeFilter} rooms yet`}</div>
            <div style={s.noResultsSub}>This conversation doesn't exist yet.</div>
            <button style={s.createTopicBtn} onClick={() => {
              if (search) setRoomName(search)
              setRoomCategory(CATEGORY_OPTIONS.includes(activeFilter) ? activeFilter : 'Culture')
              setSearch(''); setShowCreate(true)
            }}>Start one</button>
          </div>
        )}

        {publicRooms.length > 0 && (
          <>
            <div style={s.sectionLabel}>
              <span>{getSectionLabel()}</span>
              <div style={s.sectionLine} />
            </div>
            {publicRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              const isHot = hotRoomIds.includes(room.id)
              const cat = getRoomCategory(room)
              const coverImage = room.cover_image

              return (
                <div key={room.id}
                  style={{...s.card, opacity: isDeleting ? 0.5 : 1}}
                  onClick={e => openPreview(room, e)}
                >
                  {/* Cover image or gradient */}
                  <div style={{
                    ...s.cardCover,
                    backgroundImage: coverImage ? `url(${coverImage})` : undefined,
                    background: coverImage ? undefined : (CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.Culture),
                  }}>
                    <div style={s.cardCoverOverlay} />
                    {isHot && <div style={s.hotBadge}>🔥 HOT</div>}
                    <div style={s.catBadgeCover}>{cat}</div>
                  </div>

                  {/* Card content */}
                  <div style={s.cardContent}>
                    <div style={s.cardName}>{room.name}</div>
                    {room.topic && <div style={s.cardTopic}>{room.topic}</div>}
                    {preview ? (
                      <div style={s.cardPreview}>
                        <span style={s.previewName}>{preview.name}: </span>
                        <span style={s.previewText}>{preview.text.length > 80 ? preview.text.slice(0,80)+'…' : preview.text}</span>
                      </div>
                    ) : <div style={s.cardEmpty}>Be the first to say something</div>}

                    <div style={s.cardFooter}>
                      <div style={s.livePill}><div style={s.liveDot} />LIVE</div>
                      {roomMemberCounts[room.id] > 0 && (
                        <div style={s.memberPill}>{roomMemberCounts[room.id]} members</div>
                      )}
                      {room.owner_id === session.user.id && (
                        <button style={s.deleteBtn} onClick={e => deleteRoom(e, room)} disabled={isDeleting}>
                          {isDeleting ? '…' : '✕'}
                        </button>
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
            <div style={{...s.sectionLabel, marginTop:'28px'}}>
              <span>Your private rooms</span><div style={s.sectionLine} />
            </div>
            {privateRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              return (
                <div key={room.id} style={{...s.card, opacity: isDeleting ? 0.5 : 1}} onClick={e => openPreview(room, e)}>
                  <div style={{...s.cardCover, background:'linear-gradient(135deg,#1a0010,#2a0018)'}}>
                    <div style={s.cardCoverOverlay} />
                    <div style={{...s.catBadgeCover, color:'rgba(245,224,234,0.4)'}}>PRIVATE</div>
                  </div>
                  <div style={s.cardContent}>
                    <div style={s.cardName}>{room.name}</div>
                    {room.topic && <div style={s.cardTopic}>{room.topic}</div>}
                    {preview
                      ? <div style={s.cardPreview}><span style={s.previewName}>{preview.name}: </span><span style={s.previewText}>{preview.text.length > 80 ? preview.text.slice(0,80)+'…' : preview.text}</span></div>
                      : <div style={s.cardEmpty}>Invite only</div>
                    }
                    <div style={s.cardFooter}>
                      {room.owner_id === session.user.id && (
                        <button style={s.deleteBtn} onClick={e => deleteRoom(e, room)} disabled={isDeleting}>{isDeleting ? '…' : '✕'}</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {rooms.length === 0 && !search && (
          <div style={s.empty}>
            <div style={s.emptyTitle}>No rooms yet</div>
            <div style={s.emptySub}>Create the first one</div>
          </div>
        )}
        <div style={{height:'100px'}} />
      </div>

      {/* BOTTOM NAV */}
      <div style={s.bottomNav}>
        <div style={{...s.navItem, ...s.navItemActive}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span>Rooms</span>
        </div>
        <div style={s.navItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>Explore</span>
        </div>
        <button style={s.navCreate} onClick={() => setShowCreate(true)}>+</button>
        <div style={s.navItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Notifs</span>
        </div>
        <div style={s.navItem} onClick={() => navigate('/profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { minHeight:'100vh', background:'#070003', color:'#f5e0ea', fontFamily:"'DM Sans','Helvetica Neue',sans-serif" },
  header: { padding:'20px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#070003', zIndex:10, borderBottom:'1px solid rgba(192,0,58,0.1)' },
  logoWrap: { display:'flex', flexDirection:'column', gap:'2px' },
  logo: { fontFamily:"'Playfair Display',Georgia,serif", fontSize:'28px', fontWeight:'700', letterSpacing:'-0.03em', color:'#f5e0ea', lineHeight:1 },
  logoSub: { fontSize:'11px', color:'rgba(245,224,234,0.35)', letterSpacing:'0.02em' },
  signOutBtn: { padding:'7px 14px', background:'transparent', border:'1px solid rgba(192,0,58,0.2)', borderRadius:'10px', color:'rgba(245,224,234,0.35)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' },
  searchWrap: { padding:'12px 16px 8px', position:'sticky', top:'61px', background:'#070003', zIndex:9 },
  searchInner: { display:'flex', alignItems:'center', gap:'10px', background:'#1a0010', border:'1px solid rgba(192,0,58,0.15)', borderRadius:'12px', padding:'11px 14px' },
  searchInput: { flex:1, background:'none', border:'none', outline:'none', color:'#f5e0ea', fontSize:'14px', fontFamily:'inherit' },
  clearBtn: { background:'none', border:'none', color:'rgba(245,224,234,0.3)', cursor:'pointer', fontSize:'11px', padding:0 },
  filterRow: { display:'flex', gap:'8px', padding:'8px 16px 12px', overflowX:'auto', scrollbarWidth:'none' },
  filterChip: { padding:'6px 14px', borderRadius:'100px', background:'#1a0010', border:'1px solid rgba(192,0,58,0.12)', color:'rgba(245,224,234,0.4)', fontSize:'12px', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', flexShrink:0 },
  filterChipActive: { background:'rgba(192,0,58,0.15)', borderColor:'#c0003a', color:'#f5e0ea' },

  // Room card with cover image
  list: { padding:'0 16px' },
  sectionLabel: { display:'flex', alignItems:'center', gap:'10px', fontSize:'10px', color:'rgba(245,224,234,0.28)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:'12px', fontFamily:"'Space Mono',monospace" },
  sectionLine: { flex:1, height:'1px', background:'rgba(192,0,58,0.1)' },
  card: { borderRadius:'16px', overflow:'hidden', marginBottom:'12px', background:'#0e0007', border:'1px solid rgba(192,0,58,0.12)', cursor:'pointer' },
  cardCover: { position:'relative', height:'140px', backgroundSize:'cover', backgroundPosition:'center' },
  cardCoverOverlay: { position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(7,0,3,0.1) 0%, rgba(7,0,3,0.6) 100%)' },
  hotBadge: { position:'absolute', top:'10px', left:'10px', fontSize:'10px', fontFamily:"'Space Mono',monospace", color:'#ff6b35', background:'rgba(7,0,3,0.7)', border:'1px solid rgba(255,107,53,0.3)', padding:'3px 9px', borderRadius:'100px', letterSpacing:'0.06em', backdropFilter:'blur(4px)' },
  catBadgeCover: { position:'absolute', top:'10px', right:'10px', fontSize:'9px', fontFamily:"'Space Mono',monospace", color:'rgba(245,224,234,0.7)', background:'rgba(7,0,3,0.6)', border:'1px solid rgba(245,224,234,0.12)', padding:'3px 9px', borderRadius:'100px', letterSpacing:'0.06em', backdropFilter:'blur(4px)' },
  cardContent: { padding:'12px 14px 10px' },
  cardName: { fontSize:'16px', fontWeight:'700', color:'#f5e0ea', fontFamily:"'Playfair Display',Georgia,serif", letterSpacing:'-0.01em', marginBottom:'4px' },
  cardTopic: { fontSize:'12px', color:'rgba(245,224,234,0.4)', marginBottom:'6px', lineHeight:1.4 },
  cardPreview: { fontSize:'13px', lineHeight:1.4, marginBottom:'8px' },
  previewName: { color:'#c0003a', fontWeight:'600' },
  previewText: { color:'rgba(245,224,234,0.45)' },
  cardEmpty: { fontSize:'12px', color:'rgba(245,224,234,0.25)', fontStyle:'italic', marginBottom:'8px' },
  cardFooter: { display:'flex', alignItems:'center', gap:'8px' },
  livePill: { display:'flex', alignItems:'center', gap:'4px', fontSize:'9px', fontFamily:"'Space Mono',monospace", color:'#4ade80', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.18)', padding:'3px 8px', borderRadius:'100px', letterSpacing:'0.06em' },
  liveDot: { width:'5px', height:'5px', borderRadius:'50%', background:'#4ade80' },
  memberPill: { fontSize:'10px', color:'rgba(245,224,234,0.25)', fontFamily:"'Space Mono',monospace" },
  deleteBtn: { marginLeft:'auto', background:'rgba(245,224,234,0.04)', border:'1px solid rgba(245,224,234,0.06)', color:'rgba(245,224,234,0.25)', width:'24px', height:'24px', borderRadius:'8px', cursor:'pointer', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' },

  // Preview modal
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 },
  previewModal: { width:'100%', maxWidth:'500px', background:'#0e0007', borderRadius:'24px 24px 0 0', maxHeight:'90vh', overflowY:'auto', display:'flex', flexDirection:'column' },
  previewHero: { position:'relative', height:'220px', backgroundSize:'cover', backgroundPosition:'center', flexShrink:0 },
  previewHeroOverlay: { position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(7,0,3,0.2) 0%, rgba(7,0,3,0.85) 100%)' },
  previewClose: { position:'absolute', top:'14px', right:'14px', width:'30px', height:'30px', borderRadius:'50%', background:'rgba(7,0,3,0.6)', border:'1px solid rgba(245,224,234,0.15)', color:'rgba(245,224,234,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontFamily:'inherit', backdropFilter:'blur(4px)', zIndex:2 },
  previewHeroContent: { position:'absolute', bottom:'16px', left:'16px', right:'16px', zIndex:2 },
  previewCatPill: { display:'inline-block', fontSize:'9px', fontFamily:"'Space Mono',monospace", color:'#c0003a', background:'rgba(192,0,58,0.15)', border:'1px solid rgba(192,0,58,0.3)', padding:'3px 10px', borderRadius:'100px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px' },
  previewRoomName: { fontFamily:"'Playfair Display',Georgia,serif", fontSize:'24px', fontWeight:'700', color:'#f5e0ea', letterSpacing:'-0.02em', lineHeight:1.2 },
  previewRoomTopic: { fontSize:'13px', color:'rgba(245,224,234,0.6)', marginTop:'4px', lineHeight:1.4 },
  previewBody: { padding:'20px 20px 32px', display:'flex', flexDirection:'column', gap:'16px' },
  previewStats: { display:'flex', alignItems:'center', background:'rgba(192,0,58,0.06)', border:'1px solid rgba(192,0,58,0.12)', borderRadius:'14px', padding:'14px' },
  previewStat: { flex:1, textAlign:'center' },
  previewStatNum: { fontSize:'18px', fontWeight:'700', color:'#f5e0ea', fontFamily:"'Playfair Display',serif", justifyContent:'center' },
  previewStatLabel: { fontSize:'10px', color:'rgba(245,224,234,0.35)', marginTop:'2px', fontFamily:"'Space Mono',monospace" },
  previewStatDivider: { width:'1px', height:'32px', background:'rgba(192,0,58,0.15)' },
  previewMsgsLabel: { fontSize:'10px', color:'rgba(245,224,234,0.3)', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'Space Mono',monospace" },
  previewMsgs: { display:'flex', flexDirection:'column', gap:'12px' },
  previewEmpty: { fontSize:'13px', color:'rgba(245,224,234,0.3)', textAlign:'center', padding:'16px 0', fontStyle:'italic' },
  previewMsg: { display:'flex', gap:'10px', alignItems:'flex-start' },
  previewMsgAv: { width:'28px', height:'28px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' },
  previewMsgAvText: { fontFamily:"'Space Mono',monospace", fontSize:'8px', fontWeight:'700', color:'rgba(255,255,255,0.9)' },
  previewMsgMeta: { display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'2px' },
  previewMsgName: { fontSize:'12px', fontWeight:'600', color:'rgba(245,224,234,0.6)' },
  previewMsgTime: { fontSize:'9px', color:'rgba(245,224,234,0.25)', fontFamily:"'Space Mono',monospace" },
  previewMsgText: { fontSize:'13px', color:'rgba(245,224,234,0.85)', lineHeight:1.5 },
  joinBtn: { padding:'15px', background:'linear-gradient(135deg,#c0003a,#900030)', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' },
  cancelBtn: { padding:'13px', background:'transparent', border:'1px solid rgba(245,224,234,0.08)', borderRadius:'12px', color:'rgba(245,224,234,0.35)', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' },

  // Create modal
  modal: { width:'100%', maxWidth:'400px', background:'#0e0007', border:'1px solid rgba(192,0,58,0.2)', borderRadius:'20px', padding:'24px', maxHeight:'90vh', overflowY:'auto' },
  modalHeader: { marginBottom:'20px' },
  modalTitle: { fontFamily:"'Playfair Display',Georgia,serif", fontSize:'22px', fontWeight:'700', color:'#f5e0ea', letterSpacing:'-0.02em', marginBottom:'4px' },
  modalSub: { fontSize:'13px', color:'rgba(245,224,234,0.4)' },
  typeRow: { display:'flex', gap:'10px', marginBottom:'20px' },
  typeCard: { flex:1, padding:'14px 12px', borderRadius:'14px', background:'#1a0010', border:'1px solid rgba(192,0,58,0.1)', cursor:'pointer', textAlign:'center' },
  typeCardActive: { borderColor:'#c0003a', background:'rgba(192,0,58,0.12)' },
  typeLabel: { fontSize:'14px', fontWeight:'600', color:'#f5e0ea', marginBottom:'3px' },
  typeDesc: { fontSize:'11px', color:'rgba(245,224,234,0.4)', lineHeight:1.3 },
  form: { display:'flex', flexDirection:'column', gap:'12px' },
  formGroup: { display:'flex', flexDirection:'column', gap:'6px' },
  formLabel: { fontSize:'10px', color:'rgba(245,224,234,0.35)', letterSpacing:'0.1em', textTransform:'uppercase' },
  input: { width:'100%', padding:'12px 14px', background:'#1a0010', border:'1px solid rgba(192,0,58,0.15)', borderRadius:'12px', color:'#f5e0ea', fontSize:'14px', outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  categoryRow: { display:'flex', flexWrap:'wrap', gap:'8px' },
  catChip: { padding:'6px 12px', borderRadius:'100px', background:'#1a0010', border:'1px solid rgba(192,0,58,0.12)', color:'rgba(245,224,234,0.4)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' },
  catChipActive: { background:'rgba(192,0,58,0.15)', borderColor:'#c0003a', color:'#f5e0ea' },
  submitBtn: { padding:'14px', background:'linear-gradient(135deg,#c0003a,#900030)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' },

  // Empty/no results
  noResults: { textAlign:'center', padding:'48px 20px' },
  noResultsTitle: { fontSize:'16px', fontWeight:'600', color:'#f5e0ea', marginBottom:'6px' },
  noResultsSub: { fontSize:'13px', color:'rgba(245,224,234,0.35)', marginBottom:'20px' },
  createTopicBtn: { padding:'12px 20px', background:'linear-gradient(135deg,#c0003a,#900030)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' },
  empty: { textAlign:'center', padding:'72px 20px' },
  emptyTitle: { fontSize:'18px', fontWeight:'600', color:'#f5e0ea', marginBottom:'6px' },
  emptySub: { fontSize:'13px', color:'rgba(245,224,234,0.35)' },

  // Bottom nav
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, display:'flex', alignItems:'center', padding:'10px 8px 20px', background:'#0e0007', borderTop:'1px solid rgba(192,0,58,0.12)', zIndex:20 },
  navItem: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', color:'rgba(245,224,234,0.28)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer', fontFamily:"'Space Mono',monospace" },
  navItemActive: { color:'#c0003a' },
  navCreate: { width:'44px', height:'44px', borderRadius:'14px', background:'linear-gradient(135deg,#c0003a,#900030)', border:'none', color:'#fff', fontSize:'22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, margin:'0 8px', lineHeight:1, fontFamily:'inherit' },
}