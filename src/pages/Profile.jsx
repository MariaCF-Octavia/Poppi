import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

const SUPABASE_URL = 'https://exsnfnembkvuvsgdwcjp.supabase.co'

function makePublicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`
}

const THEMES = [
  { id: 'crimson',  label: 'Crimson',   bg: '#070003', accent: '#c0003a', surface: '#0e0007', text: '#f5e0ea' },
  { id: 'midnight', label: 'Midnight',  bg: '#020008', accent: '#6c3fff', surface: '#08000f', text: '#e8e0fa' },
  { id: 'forest',   label: 'Forest',    bg: '#010a03', accent: '#1a7a3a', surface: '#021205', text: '#e0f0e8' },
  { id: 'ember',    label: 'Ember',     bg: '#080300', accent: '#c45200', surface: '#0f0500', text: '#f5ede0' },
  { id: 'ocean',    label: 'Ocean',     bg: '#000810', accent: '#0077b6', surface: '#000d1a', text: '#e0f0f8' },
  { id: 'rose',     label: 'Rose',      bg: '#080004', accent: '#c0006a', surface: '#0e0008', text: '#f5e0ec' },
]

export default function Profile({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [rooms, setRooms] = useState([])
  const [joinedRooms, setJoinedRooms] = useState([])
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(null)
  const [showThemes, setShowThemes] = useState(false)
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('poppi_theme') || 'crimson')
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const coverRoomRef = useRef(null)

  const theme = THEMES.find(t => t.id === activeTheme) || THEMES[0]

  useEffect(() => { fetchProfile(); fetchRooms() }, [])

  function applyTheme(t) {
    setActiveTheme(t.id)
    localStorage.setItem('poppi_theme', t.id)
    document.documentElement.style.setProperty('--bg', t.bg)
    document.documentElement.style.setProperty('--accent', t.accent)
    document.documentElement.style.setProperty('--surface', t.surface)
    document.documentElement.style.setProperty('--text', t.text)
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('poppi_theme_change', { detail: t }))
  }

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) { setProfile(data); setDisplayName(data.display_name || ''); setBio(data.bio || '') }
  }

  async function fetchRooms() {
    const { data: created } = await supabase.from('rooms').select('*').eq('owner_id', session.user.id)
    setRooms(created || [])
    const { data: memberships } = await supabase.from('room_members').select('room_id, rooms(*)').eq('user_id', session.user.id)
    const joined = (memberships || []).map(m => m.rooms).filter(r => r && r.owner_id !== session.user.id)
    setJoinedRooms(joined)
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update({ display_name: displayName.trim(), bio: bio.trim() }).eq('id', session.user.id)
    await fetchProfile()
    setEditing(false)
    setSaving(false)
  }

  async function uploadImage(file, pathKey, dbField, setUploading) {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/${pathKey}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (error) { console.error('Upload error:', error); return }
      const url = makePublicUrl(path)
      await supabase.from('profiles').update({ [dbField]: url }).eq('id', session.user.id)
      await fetchProfile()
    } finally {
      setUploading(false)
    }
  }

  function triggerCoverUpload(e, room) {
    e.stopPropagation()
    coverRoomRef.current = room
    coverInputRef.current?.click()
  }

  async function uploadRoomCover(e) {
    const file = e.target.files?.[0]
    const room = coverRoomRef.current
    if (!file || !room) return
    setUploadingCover(room.id)
    try {
      const ext = file.name.split('.').pop()
      const path = `room-covers/${room.id}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (error) { console.error('Cover upload error:', error); return }
      const url = makePublicUrl(path)
      await supabase.from('rooms').update({ cover_image: url }).eq('id', room.id)
      await fetchRooms()
    } finally {
      setUploadingCover(null)
      e.target.value = ''
    }
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  if (!profile) return (
    <div style={{ background: '#070003', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,224,234,0.4)', fontFamily: "'DM Sans',sans-serif", fontSize: '14px' }}>Loading...</div>
  )

  const name = profile.display_name || profile.username || 'You'

  return (
    <div style={{ ...s.wrap, background: theme.bg, color: theme.text }}>

      {/* BANNER */}
      <div style={{
        ...s.banner,
        backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
        background: profile.banner_url ? undefined : `linear-gradient(135deg,${theme.surface} 0%,${theme.accent}33 50%,${theme.surface} 100%)`,
      }}>
        <div style={s.bannerOverlay} />
        <button style={{ ...s.backBtn, background: `${theme.bg}99`, borderColor: `${theme.text}1a` }} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <button style={{ ...s.changeBannerBtn, background: `${theme.bg}99` }} onClick={() => bannerInputRef.current?.click()}>
          {uploadingBanner ? 'Uploading...' : '📷 Change banner'}
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => uploadImage(e.target.files?.[0], 'banner', 'banner_url', setUploadingBanner)} />
      </div>

      {/* AVATAR ROW */}
      <div style={s.avatarRow}>
        <div style={s.avatarWrap} onClick={() => avatarInputRef.current?.click()}>
          <div style={{ ...s.avatar, background: `linear-gradient(135deg,${theme.accent},${theme.accent}88)`, borderColor: theme.bg }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
              : <span style={s.avatarInitials}>{getInitials(name)}</span>
            }
          </div>
          <div style={{ ...s.avatarBadge, background: theme.accent, borderColor: theme.bg }}>{uploadingAvatar ? '…' : '✎'}</div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => uploadImage(e.target.files?.[0], 'avatar', 'avatar_url', setUploadingAvatar)} />
        </div>
        <div style={s.headerActions}>
          <button style={{ ...s.themeBtn, borderColor: `${theme.accent}50`, color: theme.text }} onClick={() => setShowThemes(!showThemes)}>
            <div style={{ ...s.themeDot, background: theme.accent }} />
            Theme
          </button>
          <button style={{ ...s.editBtn, borderColor: `${theme.accent}50`, color: theme.text }} onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit profile'}</button>
          <button style={{ ...s.signOutBtn, color: `${theme.text}55` }} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      {/* THEME PICKER */}
      {showThemes && (
        <div style={{ ...s.themePanel, background: theme.surface, borderColor: `${theme.accent}25` }}>
          <div style={{ ...s.themePanelLabel, color: `${theme.text}44` }}>Choose your theme</div>
          <div style={s.themeGrid}>
            {THEMES.map(t => (
              <div
                key={t.id}
                style={{
                  ...s.themeCard,
                  background: t.bg,
                  borderColor: activeTheme === t.id ? t.accent : `${t.accent}25`,
                  boxShadow: activeTheme === t.id ? `0 0 0 2px ${t.accent}` : 'none',
                }}
                onClick={() => applyTheme(t)}
              >
                <div style={{ ...s.themeAccentBar, background: t.accent }} />
                <div style={{ ...s.themeCardLabel, color: t.text }}>{t.label}</div>
                {activeTheme === t.id && (
                  <div style={{ ...s.themeCheck, color: t.accent }}>✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFO */}
      <div style={s.info}>
        {editing ? (
          <form onSubmit={saveProfile} style={s.editForm}>
            <input style={{ ...s.editInput, background: theme.surface, borderColor: `${theme.accent}30`, color: theme.text }} placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus />
            <textarea style={{ ...s.editInput, background: theme.surface, borderColor: `${theme.accent}30`, color: theme.text, minHeight: '80px', resize: 'vertical', lineHeight: 1.5 }} placeholder="Bio — tell people who you are" value={bio} onChange={e => setBio(e.target.value)} />
            <button style={{ ...s.saveBtn, background: `linear-gradient(135deg,${theme.accent},${theme.accent}88)` }} type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        ) : (
          <>
            <div style={{ ...s.displayName, color: theme.text }}>{name}</div>
            <div style={{ ...s.username, color: `${theme.text}55` }}>@{profile.username}</div>
            {profile.bio && <div style={{ ...s.bio, color: `${theme.text}88` }}>{profile.bio}</div>}
          </>
        )}
      </div>

      {/* STATS */}
      <div style={{ ...s.stats, background: `${theme.accent}0f`, borderColor: `${theme.accent}20` }}>
        <div style={s.stat}><div style={{ ...s.statNum, color: theme.text }}>{rooms.length}</div><div style={{ ...s.statLabel, color: `${theme.text}55` }}>Created</div></div>
        <div style={{ ...s.statDivider, background: `${theme.accent}25` }} />
        <div style={s.stat}><div style={{ ...s.statNum, color: theme.text }}>{joinedRooms.length}</div><div style={{ ...s.statLabel, color: `${theme.text}55` }}>Joined</div></div>
        <div style={{ ...s.statDivider, background: `${theme.accent}25` }} />
        <div style={s.stat}><div style={{ ...s.statNum, color: theme.text }}>{rooms.length + joinedRooms.length}</div><div style={{ ...s.statLabel, color: `${theme.text}55` }}>Total rooms</div></div>
      </div>

      {/* Hidden cover input */}
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadRoomCover} />

      {/* CREATED ROOMS */}
      {rooms.length > 0 && (
        <div style={s.section}>
          <div style={{ ...s.sectionLabel, color: `${theme.text}40` }}><span>Created by you</span><div style={{ ...s.sectionLine, background: `${theme.accent}18` }} /></div>
          {rooms.map(room => (
            <div key={room.id} style={{ ...s.roomCard, background: theme.surface, borderColor: `${theme.accent}18` }}>
              <div
                style={{
                  ...s.roomThumb,
                  backgroundImage: room.cover_image ? `url(${room.cover_image})` : undefined,
                  background: room.cover_image ? undefined : `linear-gradient(135deg,${theme.surface},${theme.accent}44)`,
                }}
                onClick={e => triggerCoverUpload(e, room)}
              >
                <div style={s.thumbOverlay}>
                  <span style={s.thumbIcon}>{uploadingCover === room.id ? '...' : '📷'}</span>
                </div>
              </div>
              <div style={s.roomInfo} onClick={() => navigate(`/room/${room.id}`)}>
                <div style={{ ...s.roomName, color: theme.text }}>{room.name}</div>
                {room.topic && <div style={{ ...s.roomTopic, color: `${theme.text}55` }}>{room.topic}</div>}
                <div style={{ ...s.coverHint, color: `${theme.text}30` }}>tap image to change cover</div>
              </div>
              <div style={s.arrowWrap} onClick={() => navigate(`/room/${room.id}`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={`${theme.text}30`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOINED ROOMS */}
      {joinedRooms.length > 0 && (
        <div style={s.section}>
          <div style={{ ...s.sectionLabel, color: `${theme.text}40` }}><span>Joined</span><div style={{ ...s.sectionLine, background: `${theme.accent}18` }} /></div>
          {joinedRooms.map(room => (
            <div key={room.id} style={{ ...s.roomCard, background: theme.surface, borderColor: `${theme.accent}18` }} onClick={() => navigate(`/room/${room.id}`)}>
              <div style={{
                ...s.roomThumb,
                backgroundImage: room.cover_image ? `url(${room.cover_image})` : undefined,
                background: room.cover_image ? undefined : `linear-gradient(135deg,${theme.surface},${theme.accent}44)`,
              }} />
              <div style={s.roomInfo}>
                <div style={{ ...s.roomName, color: theme.text }}>{room.name}</div>
                {room.topic && <div style={{ ...s.roomTopic, color: `${theme.text}55` }}>{room.topic}</div>}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={`${theme.text}30`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}
        </div>
      )}

      {rooms.length === 0 && joinedRooms.length === 0 && (
        <div style={s.empty}>
          <div style={{ ...s.emptyText, color: `${theme.text}44` }}>No rooms yet</div>
          <button style={{ ...s.exploreBtn, background: `linear-gradient(135deg,${theme.accent},${theme.accent}88)` }} onClick={() => navigate('/')}>Find a conversation</button>
        </div>
      )}

      <div style={{ height: '40px' }} />
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
  banner: { position: 'relative', height: '180px', backgroundSize: 'cover', backgroundPosition: 'center' },
  bannerOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.5))' },
  backBtn: { position: 'absolute', top: '14px', left: '14px', width: '34px', height: '34px', borderRadius: '10px', border: '1px solid', color: '#f5e0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', zIndex: 2 },
  changeBannerBtn: { position: 'absolute', bottom: '12px', right: '14px', padding: '6px 12px', border: '1px solid rgba(245,224,234,0.15)', borderRadius: '10px', color: 'rgba(245,224,234,0.8)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(4px)', zIndex: 2 },
  avatarRow: { padding: '0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-36px', position: 'relative', zIndex: 3, flexWrap: 'wrap', gap: '8px' },
  avatarWrap: { position: 'relative', cursor: 'pointer' },
  avatar: { width: '72px', height: '72px', borderRadius: '18px', border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarInitials: { fontFamily: "'Space Mono',monospace", fontSize: '20px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  avatarBadge: { position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderRadius: '6px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' },
  headerActions: { display: 'flex', gap: '8px', paddingBottom: '6px', flexWrap: 'wrap' },
  themeBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'transparent', border: '1px solid', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  themeDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  editBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  signOutBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(245,224,234,0.1)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },

  // Theme panel
  themePanel: { margin: '16px 20px 0', border: '1px solid', borderRadius: '16px', padding: '16px' },
  themePanelLabel: { fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: '12px' },
  themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  themeCard: { position: 'relative', borderRadius: '12px', border: '1px solid', padding: '10px', cursor: 'pointer', overflow: 'hidden' },
  themeAccentBar: { height: '3px', borderRadius: '100px', marginBottom: '8px' },
  themeCardLabel: { fontSize: '11px', fontWeight: '600', fontFamily: "'DM Sans',sans-serif" },
  themeCheck: { position: 'absolute', top: '8px', right: '8px', fontSize: '12px', fontWeight: '700' },

  info: { padding: '16px 20px 0' },
  displayName: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '2px' },
  username: { fontSize: '13px', marginBottom: '8px' },
  bio: { fontSize: '14px', lineHeight: 1.6 },
  editForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  editInput: { width: '100%', padding: '12px 14px', border: '1px solid', borderRadius: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  saveBtn: { padding: '12px', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  stats: { display: 'flex', alignItems: 'center', margin: '20px 20px 0', border: '1px solid', borderRadius: '16px', padding: '16px' },
  stat: { flex: 1, textAlign: 'center' },
  statNum: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '22px', fontWeight: '700' },
  statLabel: { fontSize: '10px', marginTop: '2px', fontFamily: "'Space Mono',monospace" },
  statDivider: { width: '1px', height: '32px' },
  section: { padding: '24px 20px 0' },
  sectionLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'Space Mono',monospace" },
  sectionLine: { flex: 1, height: '1px' },
  roomCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', border: '1px solid', borderRadius: '14px', marginBottom: '8px' },
  roomThumb: { width: '48px', height: '48px', borderRadius: '10px', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, position: 'relative', cursor: 'pointer', overflow: 'hidden' },
  thumbOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  thumbIcon: { fontSize: '16px' },
  roomInfo: { flex: 1, minWidth: 0, cursor: 'pointer' },
  roomName: { fontSize: '14px', fontWeight: '600', marginBottom: '2px' },
  roomTopic: { fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  coverHint: { fontSize: '10px', marginTop: '3px', fontFamily: "'Space Mono',monospace" },
  arrowWrap: { flexShrink: 0, cursor: 'pointer', padding: '4px' },
  empty: { textAlign: 'center', padding: '48px 20px' },
  emptyText: { fontSize: '15px', marginBottom: '16px' },
  exploreBtn: { padding: '12px 24px', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
}