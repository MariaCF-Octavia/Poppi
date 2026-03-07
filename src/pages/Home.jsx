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

const ROOM_DESCRIPTIONS = {
  'No Ring After 4 Years':  'She moved in after year one. Two years of living together later — still no proposal. When does patience become self-betrayal? Come in if you\'ve been there, if you\'re there now, or if you have something honest to say.',
  'Gulf War 3.0':           'The buildup everyone saw coming is here. Civilians are queuing for fuel, the information war is already running, and the geopolitics are messier than 1991. What are you actually watching and what do you think happens next.',
  "Trump's America":        'Family group chats exploding. Friendships ending. A country that can\'t agree on basic reality. Whether you\'re inside it or watching from outside — what does it look like from where you are.',
  'Anthropic Watch':        'Claude 4 benchmarks dropped and they\'re interesting. Extended thinking, real-world performance, the alignment claims nobody else is making. For people who actually use this stuff and want to talk honestly about what it\'s doing.',
  'AI Took My Job':         '11 years of motion graphics work. £800 a day. Gone in 18 months. This room is for the people living the transition, not theorising about it. What did you lose, what did you find, and what\'s actually true.',
  'The Beauty Tax':         '£380 a month on what counts as the minimum. Hair, nails, the right kind of groomed. The tax that\'s invisible until you add it up and then you can\'t unsee it. What\'s yours, and are you angry about it.',
  'The Bondi Files':        'Sydney from the inside — not the tourist version. Newcomers figuring it out, locals telling the truth about the city. Coffee, beaches, rent, the 45-minute warmup before Australians let you in.',
  'Gen Z vs Millennials':   'Millennials wrote the thinkpieces and kept working the jobs. Gen Z read them and quit. Is that fair? Is it even the right framing? Or are we all just getting played by the same broken system and arguing about skinny jeans.',
  'Founder Life':           '4 months of runway. 18% MoM growth. The feeling where you\'re the only one who knows how thin the margin actually is. For founders who want real talk, not LinkedIn inspiration.',
  'Stockholm Nights':       'The 45-minute silence before Swedes decide to be your best friend. Fredagsmys. The best cinnamon bun in the city and where to find it. Life in Stockholm from people who actually live here.',
  'The Dating Audit':       'He confirmed the morning of. Then unmatched an hour before. Eight days of the best conversations she\'d had on an app in years. Gone. The apps are doing something to everyone\'s brain about how disposable people are.',
  'Money Talks':            'Senior engineer. £95k. 6 years. Starting with numbers because salary secrecy only benefits employers. Come in with yours or come in to learn what you\'re worth.',
  'Creative Block':         'Three months of nothing. Every piece feeling hollow before it\'s finished. A writer whose tank might have run out — or might just be full of grief they haven\'t looked at yet.',
  'Side Hustle Season':     'First £1k month. ADHD planners, 7 months, 200 reviews, one product doing 60% of revenue. The stuff that actually works when you\'re building on the side.',
}

const CATEGORY_GRADIENTS = {
  Politics:      'linear-gradient(135deg,#1a0010,#3d0020)',
  Tech:          'linear-gradient(135deg,#001a2e,#003d5c)',
  Culture:       'linear-gradient(135deg,#1a0018,#3d0040)',
  Relationships: 'linear-gradient(135deg,#1a0008,#3d0018)',
  Finance:       'linear-gradient(135deg,#0a1a00,#1a3d00)',
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

  // Preview modal: 'about' | 'conversation'
  const [previewRoom, setPreviewRoom] = useState(null)
  const [previewStage, setPreviewStage] = useState('about') // 'about' or 'conversation'
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
        .from('room_members').select('*', { count: 'exact', head: true }).eq('room_id', room.id)
      counts[room.id] = count || 0
    }))
    setRoomMemberCounts(counts)
  }

  function openAbout(room, e) {
    e.stopPropagation()
    setPreviewRoom(room)
    setPreviewStage('about')
    setPreviewMessages([])
  }

  async function goToConversation() {
    setPreviewStage('conversation')
    if (previewMessages.length > 0) return
    setPreviewLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('content, created_at, profiles(display_name, username, avatar_url)')
      .eq('room_id', previewRoom.id)
      .order('created_at', { ascending: false })
      .limit(6)
    setPreviewMessages((data || []).reverse())
    setPreviewLoading(false)
  }

  function closePreview() {
    setPreviewRoom(null)
    setPreviewStage('about')
    setPreviewMessages([])
  }

  async function joinRoom(room) {
    await supabase.from('room_members').upsert({ room_id: room.id, user_id: session.user.id })
    navigate(`/room/${room.id}`)
  }

  function getRoomCategory(room) {
    return room.category || ROOM_CATEGORIES[room.name] || 'Culture'
  }

  function getRoomDescription(room) {
    return ROOM_DESCRIPTIONS[room.name] || room.topic || 'Join the conversation.'
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
        setRoomPreviews(prev => { const n = { ...prev }; delete n[room.id]; return n })
      }
    } finally { setDeleting(null) }
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  function getAvatarColor(username) {
    const palette = ['#c0003a', '#7c2d5e', '#9b1d47', '#2060c0', '#1a7a4a', '#8B4513', '#4B0082']
    let hash = 0
    for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  const cat = previewRoom ? getRoomCategory(previewRoom) : 'Culture'
  const catGradient = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.Culture

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,224,234,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input style={s.searchInput} placeholder="Search rooms or topics..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {/* FILTERS */}
      <div style={s.filterRow}>
        {filters.map(f => (
          <button key={f}
            style={{ ...s.filterChip, ...(activeFilter === f ? s.filterChipActive : {}) }}
            onClick={() => setActiveFilter(f)}
          >{f}</button>
        ))}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {previewRoom && (
        <div style={s.overlay} onClick={closePreview}>
          <div style={s.previewSheet} onClick={e => e.stopPropagation()}>

            {/* Hero image */}
            <div style={{
              ...s.hero,
              backgroundImage: previewRoom.cover_image ? `url(${previewRoom.cover_image})` : undefined,
              background: previewRoom.cover_image ? undefined : catGradient,
            }}>
              <div style={s.heroOverlay} />
              <button style={s.closeBtn} onClick={closePreview}>✕</button>

              {previewStage === 'about' && (
                <div style={s.heroContent}>
                  <div style={s.heroCat}>{cat}</div>
                  <div style={s.heroTitle}>{previewRoom.name}</div>
                </div>
              )}

              {previewStage === 'conversation' && (
                <div style={s.heroContent}>
                  <button style={s.backStageBtn} onClick={() => setPreviewStage('about')}>
                    ← Back
                  </button>
                  <div style={s.heroTitleSm}>{previewRoom.name}</div>
                </div>
              )}
            </div>

            {/* ── STAGE 1: ABOUT ── */}
            {previewStage === 'about' && (
              <div style={s.sheetBody}>

                {/* Stats row */}
                <div style={s.statsRow}>
                  <div style={s.statItem}>
                    <div style={s.statNum}>{roomMemberCounts[previewRoom.id] || 0}</div>
                    <div style={s.statLabel}>members</div>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <div style={{ ...s.statNum, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }} />
                      Live
                    </div>
                    <div style={s.statLabel}>right now</div>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <div style={s.statNum}>{cat}</div>
                    <div style={s.statLabel}>category</div>
                  </div>
                </div>

                {/* Description — the real story */}
                <div style={s.descriptionBox}>
                  <div style={s.descriptionLabel}>What's this room about</div>
                  <div style={s.descriptionText}>{getRoomDescription(previewRoom)}</div>
                </div>

                {/* Two CTAs */}
                <button style={s.previewBtn} onClick={goToConversation}>
                  <span>See the conversation</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <button style={s.joinBtnPrimary} onClick={() => joinRoom(previewRoom)}>
                  Jump straight in
                </button>
                <button style={s.maybeLaterBtn} onClick={closePreview}>
                  Maybe later
                </button>
              </div>
            )}

            {/* ── STAGE 2: CONVERSATION PREVIEW ── */}
            {previewStage === 'conversation' && (
              <div style={s.sheetBody}>

                <div style={s.liveRow}>
                  <div style={s.liveDot} />
                  <span style={s.liveLabel}>Live conversation</span>
                  <span style={s.liveSubLabel}>— read only until you join</span>
                </div>

                <div style={s.msgList}>
                  {previewLoading && <div style={s.loadingText}>Loading...</div>}
                  {!previewLoading && previewMessages.length === 0 && (
                    <div style={s.loadingText}>No messages yet. Be the first.</div>
                  )}
                  {!previewLoading && previewMessages.map((msg, i) => {
                    const name = msg.profiles?.display_name || msg.profiles?.username || 'Someone'
                    const username = msg.profiles?.username || ''
                    const avatarUrl = msg.profiles?.avatar_url
                    return (
                      <div key={i} style={s.msgRow}>
                        <div style={{ ...s.msgAv, background: getAvatarColor(username) }}>
                          {avatarUrl
                            ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                            : <span style={s.msgAvText}>{getInitials(name)}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={s.msgMeta}>
                            <span style={s.msgName}>{name}</span>
                            <span style={s.msgTime}>{timeAgo(msg.created_at)}</span>
                          </div>
                          <div style={s.msgText}>{msg.content}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Fade + join CTA */}
                <div style={s.joinFade} />
                <div style={s.joinCTAWrap}>
                  <div style={s.joinCTALabel}>Join to keep reading and reply</div>
                  <button style={s.joinBtnPrimary} onClick={() => joinRoom(previewRoom)}>
                    Join the conversation
                  </button>
                  <button style={s.maybeLaterBtn} onClick={closePreview}>Maybe later</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.createSheet}>
            <div style={s.createHeader}>
              <div style={s.createTitle}>Create a room</div>
              <div style={s.createSub}>Where do you want to take people?</div>
            </div>
            <div style={s.typeRow}>
              {[false, true].map(priv => (
                <div key={String(priv)}
                  style={{ ...s.typeCard, ...(isPrivate === priv ? s.typeCardActive : {}) }}
                  onClick={() => setIsPrivate(priv)}
                >
                  <div style={s.typeLabel}>{priv ? '🔒 Private' : '🌐 Public'}</div>
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
                <label style={s.formLabel}>What's the story?</label>
                <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical', lineHeight: 1.5 }} placeholder="What's actually being discussed here. Be specific — this is what people see before they join." value={roomTopic} onChange={e => setRoomTopic(e.target.value)} />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Category</label>
                <div style={s.categoryRow}>
                  {CATEGORY_OPTIONS.map(cat => (
                    <button key={cat} type="button"
                      style={{ ...s.catChip, ...(roomCategory === cat ? s.catChipActive : {}) }}
                      onClick={() => setRoomCategory(cat)}
                    >{cat}</button>
                  ))}
                </div>
              </div>
              <button style={s.submitBtn} type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create room'}</button>
              <button style={s.maybeLaterBtn} type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* ── FEED ── */}
      <div style={s.list}>
        {noResults && (
          <div style={s.noResults}>
            <div style={s.noResultsTitle}>{search ? `No rooms for "${search}"` : `No ${activeFilter} rooms yet`}</div>
            <div style={s.noResultsSub}>This conversation doesn't exist yet.</div>
            <button style={s.submitBtn} onClick={() => {
              if (search) setRoomName(search)
              setRoomCategory(CATEGORY_OPTIONS.includes(activeFilter) ? activeFilter : 'Culture')
              setSearch(''); setShowCreate(true)
            }}>Start one</button>
          </div>
        )}

        {publicRooms.length > 0 && (
          <>
            <div style={s.sectionLabel}>
              <span>{getSectionLabel()}</span><div style={s.sectionLine} />
            </div>
            {publicRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              const isHot = hotRoomIds.includes(room.id)
              const cat = getRoomCategory(room)
              const coverImage = room.cover_image

              return (
                <div key={room.id} style={{ ...s.card, opacity: isDeleting ? 0.5 : 1 }}
                  onClick={e => openAbout(room, e)}
                >
                  <div style={{
                    ...s.cardCover,
                    backgroundImage: coverImage ? `url(${coverImage})` : undefined,
                    background: coverImage ? undefined : (CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.Culture),
                  }}>
                    <div style={s.cardCoverOverlay} />
                    {isHot && <div style={s.hotBadge}>🔥 HOT</div>}
                    <div style={s.catBadge}>{cat}</div>
                  </div>

                  <div style={s.cardContent}>
                    <div style={s.cardName}>{room.name}</div>
                    {room.topic && <div style={s.cardTopic}>{room.topic}</div>}
                    {preview
                      ? <div style={s.cardPreview}>
                        <span style={s.previewName}>{preview.name}: </span>
                        <span style={s.previewText}>{preview.text.length > 80 ? preview.text.slice(0, 80) + '…' : preview.text}</span>
                      </div>
                      : <div style={s.cardEmpty}>Be the first to say something</div>
                    }
                    <div style={s.cardFooter}>
                      <div style={s.livePill}><div style={s.livePillDot} />LIVE</div>
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
            <div style={{ ...s.sectionLabel, marginTop: '28px' }}>
              <span>Your private rooms</span><div style={s.sectionLine} />
            </div>
            {privateRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              return (
                <div key={room.id} style={{ ...s.card, opacity: isDeleting ? 0.5 : 1 }} onClick={e => openAbout(room, e)}>
                  <div style={{ ...s.cardCover, background: 'linear-gradient(135deg,#1a0010,#2a0018)' }}>
                    <div style={s.cardCoverOverlay} />
                    <div style={{ ...s.catBadge, color: 'rgba(245,224,234,0.35)' }}>PRIVATE</div>
                  </div>
                  <div style={s.cardContent}>
                    <div style={s.cardName}>{room.name}</div>
                    {room.topic && <div style={s.cardTopic}>{room.topic}</div>}
                    {preview
                      ? <div style={s.cardPreview}><span style={s.previewName}>{preview.name}: </span><span style={s.previewText}>{preview.text.length > 80 ? preview.text.slice(0, 80) + '…' : preview.text}</span></div>
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
        <div style={{ height: '100px' }} />
      </div>

      {/* BOTTOM NAV */}
      <div style={s.bottomNav}>
        <div style={{ ...s.navItem, ...s.navItemActive }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
          <span>Rooms</span>
        </div>
        <div style={s.navItem} onClick={() => navigate('/messages')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Messages</span>
        </div>
        <button style={s.navCreate} onClick={() => setShowCreate(true)}>+</button>
        <div style={s.navItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          <span>Notifs</span>
        </div>
        <div style={s.navItem} onClick={() => navigate('/profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <span>Profile</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', background: '#070003', color: '#f5e0ea', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
  header: { padding: '20px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#070003', zIndex: 10, borderBottom: '1px solid rgba(192,0,58,0.1)' },
  logoWrap: { display: 'flex', flexDirection: 'column', gap: '2px' },
  logo: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '28px', fontWeight: '700', letterSpacing: '-0.03em', color: '#f5e0ea', lineHeight: 1 },
  logoSub: { fontSize: '11px', color: 'rgba(245,224,234,0.35)', letterSpacing: '0.02em' },
  signOutBtn: { padding: '7px 14px', background: 'transparent', border: '1px solid rgba(192,0,58,0.2)', borderRadius: '10px', color: 'rgba(245,224,234,0.35)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  searchWrap: { padding: '12px 16px 8px', position: 'sticky', top: '61px', background: '#070003', zIndex: 9 },
  searchInner: { display: 'flex', alignItems: 'center', gap: '10px', background: '#1a0010', border: '1px solid rgba(192,0,58,0.15)', borderRadius: '12px', padding: '11px 14px' },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f5e0ea', fontSize: '14px', fontFamily: 'inherit' },
  clearBtn: { background: 'none', border: 'none', color: 'rgba(245,224,234,0.3)', cursor: 'pointer', fontSize: '11px', padding: 0 },
  filterRow: { display: 'flex', gap: '8px', padding: '8px 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' },
  filterChip: { padding: '6px 14px', borderRadius: '100px', background: '#1a0010', border: '1px solid rgba(192,0,58,0.12)', color: 'rgba(245,224,234,0.4)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 },
  filterChipActive: { background: 'rgba(192,0,58,0.15)', borderColor: '#c0003a', color: '#f5e0ea' },

  // Overlay + sheet
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  previewSheet: { width: '100%', maxWidth: '500px', background: '#0e0007', borderRadius: '24px 24px 0 0', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },

  // Hero
  hero: { position: 'relative', height: '200px', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, borderRadius: '24px 24px 0 0', overflow: 'hidden' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(7,0,3,0.15) 0%,rgba(7,0,3,0.82) 100%)' },
  closeBtn: { position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(7,0,3,0.65)', border: '1px solid rgba(245,224,234,0.15)', color: 'rgba(245,224,234,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 2, fontFamily: 'inherit', backdropFilter: 'blur(4px)' },
  heroContent: { position: 'absolute', bottom: '16px', left: '18px', right: '60px', zIndex: 2 },
  heroCat: { display: 'inline-block', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: '#c0003a', background: 'rgba(192,0,58,0.18)', border: '1px solid rgba(192,0,58,0.35)', padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' },
  heroTitle: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '26px', fontWeight: '700', color: '#f5e0ea', letterSpacing: '-0.02em', lineHeight: 1.15 },
  heroTitleSm: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '18px', fontWeight: '700', color: '#f5e0ea', letterSpacing: '-0.01em' },
  backStageBtn: { background: 'none', border: 'none', color: 'rgba(245,224,234,0.6)', fontSize: '13px', cursor: 'pointer', padding: '0 0 8px', fontFamily: 'inherit', display: 'block' },

  // Sheet body
  sheetBody: { padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: '14px' },

  // Stats
  statsRow: { display: 'flex', alignItems: 'center', background: 'rgba(192,0,58,0.06)', border: '1px solid rgba(192,0,58,0.12)', borderRadius: '14px', padding: '14px', flexShrink: 0 },
  statItem: { flex: 1, textAlign: 'center' },
  statNum: { fontSize: '16px', fontWeight: '700', color: '#f5e0ea', fontFamily: "'Playfair Display',serif", display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '9px', color: 'rgba(245,224,234,0.35)', marginTop: '2px', fontFamily: "'Space Mono',monospace" },
  statDivider: { width: '1px', height: '28px', background: 'rgba(192,0,58,0.15)' },

  // Description
  descriptionBox: { background: 'rgba(245,224,234,0.03)', border: '1px solid rgba(245,224,234,0.06)', borderRadius: '14px', padding: '16px' },
  descriptionLabel: { fontSize: '9px', color: 'rgba(245,224,234,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: '10px' },
  descriptionText: { fontSize: '14px', color: 'rgba(245,224,234,0.85)', lineHeight: 1.7 },

  // Buttons
  previewBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'transparent', border: '1px solid rgba(192,0,58,0.35)', borderRadius: '14px', color: '#f5e0ea', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  joinBtnPrimary: { padding: '15px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  maybeLaterBtn: { padding: '13px', background: 'transparent', border: 'none', color: 'rgba(245,224,234,0.3)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },

  // Conversation preview
  liveRow: { display: 'flex', alignItems: 'center', gap: '7px' },
  liveDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 },
  liveLabel: { fontSize: '11px', color: 'rgba(245,224,234,0.5)', fontFamily: "'Space Mono',monospace", letterSpacing: '0.08em' },
  liveSubLabel: { fontSize: '11px', color: 'rgba(245,224,234,0.25)', fontFamily: "'Space Mono',monospace" },
  msgList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  loadingText: { fontSize: '13px', color: 'rgba(245,224,234,0.3)', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' },
  msgRow: { display: 'flex', gap: '10px', alignItems: 'flex-start' },
  msgAv: { width: '30px', height: '30px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  msgAvText: { fontFamily: "'Space Mono',monospace", fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  msgMeta: { display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px' },
  msgName: { fontSize: '12px', fontWeight: '600', color: 'rgba(245,224,234,0.65)' },
  msgTime: { fontSize: '9px', color: 'rgba(245,224,234,0.25)', fontFamily: "'Space Mono',monospace" },
  msgText: { fontSize: '13px', color: 'rgba(245,224,234,0.85)', lineHeight: 1.55 },
  joinFade: { height: '40px', background: 'linear-gradient(to bottom,transparent,#0e0007)', marginTop: '-40px', flexShrink: 0, pointerEvents: 'none' },
  joinCTAWrap: { display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' },
  joinCTALabel: { fontSize: '12px', color: 'rgba(245,224,234,0.35)', textAlign: 'center', fontStyle: 'italic' },

  // Create sheet
  createSheet: { width: '100%', maxWidth: '500px', background: '#0e0007', border: '1px solid rgba(192,0,58,0.15)', borderRadius: '24px 24px 0 0', padding: '24px', maxHeight: '92vh', overflowY: 'auto' },
  createHeader: { marginBottom: '20px' },
  createTitle: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '22px', fontWeight: '700', color: '#f5e0ea', letterSpacing: '-0.02em', marginBottom: '4px' },
  createSub: { fontSize: '13px', color: 'rgba(245,224,234,0.4)' },
  typeRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  typeCard: { flex: 1, padding: '14px 12px', borderRadius: '14px', background: '#1a0010', border: '1px solid rgba(192,0,58,0.1)', cursor: 'pointer', textAlign: 'center' },
  typeCardActive: { borderColor: '#c0003a', background: 'rgba(192,0,58,0.12)' },
  typeLabel: { fontSize: '14px', fontWeight: '600', color: '#f5e0ea', marginBottom: '3px' },
  typeDesc: { fontSize: '11px', color: 'rgba(245,224,234,0.4)', lineHeight: 1.3 },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '10px', color: 'rgba(245,224,234,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px 14px', background: '#1a0010', border: '1px solid rgba(192,0,58,0.15)', borderRadius: '12px', color: '#f5e0ea', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  categoryRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  catChip: { padding: '6px 12px', borderRadius: '100px', background: '#1a0010', border: '1px solid rgba(192,0,58,0.12)', color: 'rgba(245,224,234,0.4)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  catChipActive: { background: 'rgba(192,0,58,0.15)', borderColor: '#c0003a', color: '#f5e0ea' },
  submitBtn: { padding: '14px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },

  // Feed
  list: { padding: '0 16px' },
  sectionLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(245,224,234,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'Space Mono',monospace" },
  sectionLine: { flex: 1, height: '1px', background: 'rgba(192,0,58,0.1)' },
  card: { borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', background: '#0e0007', border: '1px solid rgba(192,0,58,0.12)', cursor: 'pointer' },
  cardCover: { position: 'relative', height: '140px', backgroundSize: 'cover', backgroundPosition: 'center' },
  cardCoverOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(7,0,3,0.05) 0%,rgba(7,0,3,0.55) 100%)' },
  hotBadge: { position: 'absolute', top: '10px', left: '10px', fontSize: '10px', fontFamily: "'Space Mono',monospace", color: '#ff6b35', background: 'rgba(7,0,3,0.7)', border: '1px solid rgba(255,107,53,0.3)', padding: '3px 9px', borderRadius: '100px', letterSpacing: '0.06em', backdropFilter: 'blur(4px)' },
  catBadge: { position: 'absolute', top: '10px', right: '10px', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: 'rgba(245,224,234,0.7)', background: 'rgba(7,0,3,0.6)', border: '1px solid rgba(245,224,234,0.12)', padding: '3px 9px', borderRadius: '100px', letterSpacing: '0.06em', backdropFilter: 'blur(4px)' },
  cardContent: { padding: '12px 14px 10px' },
  cardName: { fontSize: '16px', fontWeight: '700', color: '#f5e0ea', fontFamily: "'Playfair Display',Georgia,serif", letterSpacing: '-0.01em', marginBottom: '4px' },
  cardTopic: { fontSize: '12px', color: 'rgba(245,224,234,0.4)', marginBottom: '6px', lineHeight: 1.4 },
  cardPreview: { fontSize: '13px', lineHeight: 1.4, marginBottom: '8px' },
  previewName: { color: '#c0003a', fontWeight: '600' },
  previewText: { color: 'rgba(245,224,234,0.45)' },
  cardEmpty: { fontSize: '12px', color: 'rgba(245,224,234,0.25)', fontStyle: 'italic', marginBottom: '8px' },
  cardFooter: { display: 'flex', alignItems: 'center', gap: '8px' },
  livePill: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)', padding: '3px 8px', borderRadius: '100px', letterSpacing: '0.06em' },
  livePillDot: { width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' },
  memberPill: { fontSize: '10px', color: 'rgba(245,224,234,0.25)', fontFamily: "'Space Mono',monospace" },
  deleteBtn: { marginLeft: 'auto', background: 'rgba(245,224,234,0.04)', border: '1px solid rgba(245,224,234,0.06)', color: 'rgba(245,224,234,0.25)', width: '24px', height: '24px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  noResults: { textAlign: 'center', padding: '48px 20px' },
  noResultsTitle: { fontSize: '16px', fontWeight: '600', color: '#f5e0ea', marginBottom: '6px' },
  noResultsSub: { fontSize: '13px', color: 'rgba(245,224,234,0.35)', marginBottom: '20px' },
  empty: { textAlign: 'center', padding: '72px 20px' },
  emptyTitle: { fontSize: '18px', fontWeight: '600', color: '#f5e0ea', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: 'rgba(245,224,234,0.35)' },

  // Bottom nav
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '10px 8px 20px', background: '#0e0007', borderTop: '1px solid rgba(192,0,58,0.12)', zIndex: 20 },
  navItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(245,224,234,0.28)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: "'Space Mono',monospace" },
  navItemActive: { color: '#c0003a' },
  navCreate: { width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: '0 8px', lineHeight: 1, fontFamily: 'inherit' },
}