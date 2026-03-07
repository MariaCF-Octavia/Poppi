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
  const [activeFilter, setActiveFilter] = useState('All')
  const navigate = useNavigate()

  const filters = ['All', 'Hot', 'Politics', 'Tech', 'Culture', 'Relationships', 'Finance']

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
      const { error: msgErr } = await supabase.from('messages').delete().eq('room_id', room.id)
      if (msgErr) console.error('msg delete error:', msgErr)
      const { error: memErr } = await supabase.from('room_members').delete().eq('room_id', room.id)
      if (memErr) console.error('member delete error:', memErr)
      const { error: roomErr } = await supabase.from('rooms').delete().eq('id', room.id)
      if (roomErr) {
        console.error('room delete error:', roomErr)
        alert('Could not delete room. Check Supabase RLS policies.')
      } else {
        setRooms(prev => prev.filter(r => r.id !== room.id))
        setRoomPreviews(prev => { const n = {...prev}; delete n[room.id]; return n })
      }
    } finally {
      setDeleting(null)
    }
  }

  async function joinRoom(room) {
    await supabase.from('room_members').upsert({ room_id: room.id, user_id: session.user.id })
    navigate(`/room/${room.id}`)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  function getAccentColor(name) {
    const palette = ['#c0003a','#9b1d47','#7c2d5e','#a03060','#b02050']
    let hash = 0
    for (let c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
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

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.logoWrap}>
          <div style={s.logo}>poppi</div>
          <div style={s.logoSub}>Find your conversation</div>
        </div>
        <div style={s.headerActions}>
          <button style={s.signOutBtn} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div style={s.searchWrap}>
        <div style={s.searchInner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,224,234,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={s.searchInput}
            placeholder="Search rooms or topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={s.filterRow}>
        {filters.map(f => (
          <button
            key={f}
            style={{...s.filterChip, ...(activeFilter === f ? s.filterChipActive : {})}}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Create a room</div>
              <div style={s.modalSub}>Where do you want to take people?</div>
            </div>

            {/* Public / Private toggle */}
            <div style={s.typeRow}>
              <div
                style={{...s.typeCard, ...(isPrivate ? {} : s.typeCardActive)}}
                onClick={() => setIsPrivate(false)}
              >
                <div style={s.typeLabel}>Public</div>
                <div style={s.typeDesc}>Anyone can find and join</div>
              </div>
              <div
                style={{...s.typeCard, ...(isPrivate ? s.typeCardActive : {})}}
                onClick={() => setIsPrivate(true)}
              >
                <div style={s.typeLabel}>Private</div>
                <div style={s.typeDesc}>Invite link or code only</div>
              </div>
            </div>

            <form onSubmit={createRoom} style={s.form}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Room name</label>
                <input
                  style={s.input}
                  placeholder="e.g. Gulf War 3.0"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>What's this room about?</label>
                <textarea
                  style={{...s.input, minHeight:'72px', resize:'vertical', lineHeight:1.5}}
                  placeholder="The ongoing topic or theme of this room"
                  value={roomTopic}
                  onChange={e => setRoomTopic(e.target.value)}
                />
              </div>
              <button style={s.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create room'}
              </button>
              <button style={s.cancelBtn} type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FEED ── */}
      <div style={s.list}>

        {noResults && (
          <div style={s.noResults}>
            <div style={s.noResultsTitle}>No rooms found for "{search}"</div>
            <div style={s.noResultsSub}>This conversation doesn't exist yet.</div>
            <button
              style={s.createTopicBtn}
              onClick={() => { setRoomName(search); setSearch(''); setShowCreate(true) }}
            >
              Create a room for "{search}"
            </button>
          </div>
        )}

        {publicRooms.length > 0 && (
          <>
            <div style={s.sectionLabel}>
              <span>{search ? 'Results' : 'Live rooms'}</span>
              <div style={s.sectionLine} />
            </div>
            {publicRooms.map((room, i) => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              const isHot = i < 2
              return (
                <div
                  key={room.id}
                  style={{...s.card, opacity: isDeleting ? 0.5 : 1}}
                  onClick={() => joinRoom(room)}
                >
                  {/* Room avatar */}
                  <div style={{...s.cardAv, background: getAccentColor(room.name)}}>
                    <span style={s.cardAvText}>{getInitials(room.name)}</span>
                  </div>

                  <div style={s.cardBody}>
                    <div style={s.cardTop}>
                      <div style={s.cardName}>{room.name}</div>
                      <div style={s.cardRight}>
                        {isHot && <div style={s.hotBadge}>HOT</div>}
                        <div style={s.liveBadge}>
                          <div style={s.liveDot} />
                          LIVE
                        </div>
                      </div>
                    </div>

                    {room.topic && (
                      <div style={s.cardTopic}>{room.topic}</div>
                    )}

                    {preview ? (
                      <div style={s.cardPreview}>
                        <span style={s.previewName}>{preview.name}: </span>
                        <span style={s.previewText}>
                          {preview.text.length > 85 ? preview.text.slice(0, 85) + '…' : preview.text}
                        </span>
                      </div>
                    ) : (
                      <div style={s.cardEmpty}>Be the first to say something</div>
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
            <div style={{...s.sectionLabel, marginTop:'28px'}}>
              <span>Your private rooms</span>
              <div style={s.sectionLine} />
            </div>
            {privateRooms.map(room => {
              const preview = roomPreviews[room.id]
              const isDeleting = deleting === room.id
              return (
                <div
                  key={room.id}
                  style={{...s.card, borderColor:'rgba(192,0,58,0.08)', opacity: isDeleting ? 0.5 : 1}}
                  onClick={() => joinRoom(room)}
                >
                  <div style={{...s.cardAv, background:'#1a0010', border:'1px solid rgba(192,0,58,0.2)'}}>
                    <span style={{...s.cardAvText, color:'rgba(245,224,234,0.4)', fontSize:'10px', letterSpacing:'0.05em'}}>PVT</span>
                  </div>
                  <div style={s.cardBody}>
                    <div style={s.cardTop}>
                      <div style={s.cardName}>{room.name}</div>
                      <div style={{...s.liveBadge, background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'rgba(245,224,234,0.3)'}}>
                        PRIVATE
                      </div>
                    </div>
                    {room.topic && <div style={s.cardTopic}>{room.topic}</div>}
                    {preview ? (
                      <div style={s.cardPreview}>
                        <span style={s.previewName}>{preview.name}: </span>
                        <span style={s.previewText}>
                          {preview.text.length > 85 ? preview.text.slice(0, 85) + '…' : preview.text}
                        </span>
                      </div>
                    ) : (
                      <div style={s.cardEmpty}>Invite only</div>
                    )}
                  </div>
                  {room.owner_id === session.user.id && (
                    <button style={s.deleteBtn} onClick={e => deleteRoom(e, room)} disabled={isDeleting}>
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
            <div style={s.emptyTitle}>No rooms yet</div>
            <div style={s.emptySub}>Create the first one</div>
          </div>
        )}

        <div style={{height:'100px'}} />
      </div>

      {/* ── BOTTOM NAV ── */}
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
        <div style={s.navItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    minHeight: '100vh',
    background: '#070003',
    color: '#f5e0ea',
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    position: 'relative',
  },

  // Header
  header: {
    padding: '20px 20px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    background: '#070003',
    zIndex: 10,
    borderBottom: '1px solid rgba(192,0,58,0.1)',
  },
  logoWrap: { display: 'flex', flexDirection: 'column', gap: '2px' },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    color: '#f5e0ea',
    lineHeight: 1,
  },
  logoSub: {
    fontSize: '11px',
    color: 'rgba(245,224,234,0.35)',
    letterSpacing: '0.02em',
  },
  headerActions: { display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' },
  signOutBtn: {
    padding: '7px 14px',
    background: 'transparent',
    border: '1px solid rgba(192,0,58,0.2)',
    borderRadius: '10px',
    color: 'rgba(245,224,234,0.35)',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Search
  searchWrap: {
    padding: '12px 16px 8px',
    position: 'sticky',
    top: '69px',
    background: '#070003',
    zIndex: 9,
  },
  searchInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#1a0010',
    border: '1px solid rgba(192,0,58,0.15)',
    borderRadius: '12px',
    padding: '11px 14px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#f5e0ea',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(245,224,234,0.3)',
    cursor: 'pointer',
    fontSize: '11px',
    padding: 0,
    fontFamily: 'inherit',
  },

  // Filters
  filterRow: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px 12px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  filterChip: {
    padding: '6px 14px',
    borderRadius: '100px',
    background: '#1a0010',
    border: '1px solid rgba(192,0,58,0.12)',
    color: 'rgba(245,224,234,0.4)',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  filterChipActive: {
    background: 'rgba(192,0,58,0.15)',
    borderColor: '#c0003a',
    color: '#f5e0ea',
  },

  // Create modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    background: '#0e0007',
    border: '1px solid rgba(192,0,58,0.2)',
    borderRadius: '20px',
    padding: '24px',
  },
  modalHeader: { marginBottom: '20px' },
  modalTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '22px',
    fontWeight: '700',
    color: '#f5e0ea',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  modalSub: { fontSize: '13px', color: 'rgba(245,224,234,0.4)' },
  typeRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  typeCard: {
    flex: 1,
    padding: '14px 12px',
    borderRadius: '14px',
    background: '#1a0010',
    border: '1px solid rgba(192,0,58,0.1)',
    cursor: 'pointer',
    textAlign: 'center',
  },
  typeCardActive: {
    borderColor: '#c0003a',
    background: 'rgba(192,0,58,0.12)',
  },
  typeLabel: { fontSize: '14px', fontWeight: '600', color: '#f5e0ea', marginBottom: '3px' },
  typeDesc: { fontSize: '11px', color: 'rgba(245,224,234,0.4)', lineHeight: 1.3 },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: {
    fontSize: '10px',
    color: 'rgba(245,224,234,0.35)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: '#1a0010',
    border: '1px solid rgba(192,0,58,0.15)',
    borderRadius: '12px',
    color: '#f5e0ea',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  submitBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #c0003a, #900030)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    padding: '13px',
    background: 'transparent',
    border: '1px solid rgba(245,224,234,0.08)',
    borderRadius: '12px',
    color: 'rgba(245,224,234,0.35)',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Feed
  list: { padding: '8px 16px 0' },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '10px',
    color: 'rgba(245,224,234,0.28)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: '12px',
    fontFamily: "'Space Mono', monospace",
  },
  sectionLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(192,0,58,0.1)',
  },

  // Room card
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    background: '#0e0007',
    border: '1px solid rgba(192,0,58,0.12)',
    borderRadius: '16px',
    marginBottom: '10px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  cardAv: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardAvText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: '0.02em',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '4px',
  },
  cardName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#f5e0ea',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardRight: { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  hotBadge: {
    fontSize: '9px',
    fontFamily: "'Space Mono', monospace",
    color: '#ff6b35',
    background: 'rgba(255,107,53,0.12)',
    border: '1px solid rgba(255,107,53,0.25)',
    padding: '2px 7px',
    borderRadius: '100px',
    letterSpacing: '0.06em',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '9px',
    fontFamily: "'Space Mono', monospace",
    color: '#4ade80',
    background: 'rgba(74,222,128,0.08)',
    border: '1px solid rgba(74,222,128,0.18)',
    padding: '2px 7px',
    borderRadius: '100px',
    letterSpacing: '0.06em',
  },
  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#4ade80',
    animation: 'pulse 2s infinite',
  },
  cardTopic: {
    fontSize: '12px',
    color: 'rgba(245,224,234,0.4)',
    marginBottom: '6px',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
  },
  cardPreview: { fontSize: '13px', lineHeight: 1.4 },
  previewName: { color: '#c0003a', fontWeight: '600' },
  previewText: { color: 'rgba(245,224,234,0.4)' },
  cardEmpty: { fontSize: '12px', color: 'rgba(245,224,234,0.25)', fontStyle: 'italic' },
  deleteBtn: {
    background: 'rgba(245,224,234,0.04)',
    border: '1px solid rgba(245,224,234,0.06)',
    color: 'rgba(245,224,234,0.25)',
    width: '26px',
    height: '26px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'inherit',
  },

  // Empty states
  noResults: { textAlign: 'center', padding: '48px 20px' },
  noResultsTitle: { fontSize: '16px', fontWeight: '600', color: '#f5e0ea', marginBottom: '6px' },
  noResultsSub: { fontSize: '13px', color: 'rgba(245,224,234,0.35)', marginBottom: '20px' },
  createTopicBtn: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #c0003a, #900030)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  empty: { textAlign: 'center', padding: '72px 20px' },
  emptyTitle: { fontSize: '18px', fontWeight: '600', color: '#f5e0ea', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: 'rgba(245,224,234,0.35)' },

  // Bottom nav
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '10px 8px 20px',
    background: '#0e0007',
    borderTop: '1px solid rgba(192,0,58,0.12)',
    zIndex: 20,
  },
  navItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    color: 'rgba(245,224,234,0.28)',
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
  },
  navItemActive: { color: '#c0003a' },
  navCreate: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #c0003a, #900030)',
    border: 'none',
    color: '#fff',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    margin: '0 8px',
    lineHeight: 1,
    fontFamily: 'inherit',
  },
}