import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

const SUPABASE_URL = 'https://exsnfnembkvuvsgdwcjp.supabase.co'

function makePublicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`
}

export default function Profile({ session }) {
  const navigate = useNavigate()
  const { theme, themeId, setTheme, allThemes } = useTheme()
  const t = theme
  const userId = session?.user?.id
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
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const coverRoomRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    fetchProfile()
    fetchRooms()
  }, [userId])

  async function fetchProfile() {
    if (!userId) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) { setProfile(data); setDisplayName(data.display_name || ''); setBio(data.bio || '') }
  }

  async function fetchRooms() {
    if (!userId) return
    const { data: created } = await supabase.from('rooms').select('*').eq('owner_id', userId)
    setRooms(created || [])
    const { data: memberships } = await supabase.from('room_members').select('room_id, rooms(*)').eq('user_id', userId)
    const joined = (memberships || []).map(m => m.rooms).filter(r => r && r.owner_id !== userId)
    setJoinedRooms(joined)
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    await supabase.from('profiles').update({ display_name: displayName.trim(), bio: bio.trim() }).eq('id', userId)
    setProfile(prev => ({ ...prev, display_name: displayName.trim(), bio: bio.trim() }))
    setEditing(false); setSaving(false)
  }

  async function uploadImage(file, pathKey, dbField, setUploading) {
    if (!file || !userId) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${userId}/${pathKey}-${Date.now()}.${ext}`
      const { data: uploadData, error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) { alert(`Upload failed: ${error.message}`); return }
      const url = makePublicUrl(uploadData?.path || path)
      const { error: dbError } = await supabase.from('profiles').update({ [dbField]: url }).eq('id', userId)
      if (dbError) { alert(`Save failed: ${dbError.message}`); return }
      setProfile(prev => ({ ...prev, [dbField]: url }))
    } catch (err) {
      alert(`Unexpected error: ${err.message}`)
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
    if (!file || !room || !userId) return
    setUploadingCover(room.id)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `room-covers/${room.id}-${Date.now()}.${ext}`
      const { data: uploadData, error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) { alert(`Cover upload failed: ${error.message}`); return }
      const url = makePublicUrl(uploadData?.path || path)
      const { error: dbError } = await supabase.from('rooms').update({ cover_image: url }).eq('id', room.id)
      if (dbError) { alert(`Cover save failed: ${dbError.message}`); return }
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, cover_image: url } : r))
    } catch (err) {
      alert(`Unexpected error: ${err.message}`)
    } finally {
      setUploadingCover(null)
      e.target.value = ''
    }
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  if (!profile) return (
    <div style={{ background: t.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text3, fontFamily: "'DM Sans',sans-serif", fontSize: '14px' }}>
      Loading...
    </div>
  )

  const name = profile.display_name || profile.username || 'You'

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* BANNER — fixed img tag */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: `linear-gradient(135deg,${t.surface} 0%,${t.surface2} 50%,${t.surface} 100%)` }}>
        {profile.banner_url && (
          <img src={profile.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.45))' }} />
        <button style={{ position: 'absolute', top: 14, left: 14, width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
          onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <button style={{ position: 'absolute', bottom: 12, right: 14, padding: '6px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', zIndex: 2 }}
          onClick={() => bannerInputRef.current?.click()}>
          {uploadingBanner ? 'Uploading...' : '📷 Change banner'}
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'banner', 'banner_url', setUploadingBanner) }} />
      </div>

      {/* AVATAR ROW */}
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, position: 'relative', zIndex: 3, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => avatarInputRef.current?.click()}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: `3px solid ${t.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
              : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
            }
          </div>
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 6, background: t.accent, border: `2px solid ${t.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white' }}>
            {uploadingAvatar ? '…' : '✎'}
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'avatar', 'avatar_url', setUploadingAvatar) }} />
        </div>

        <div style={{ display: 'flex', gap: 8, paddingBottom: 6, flexWrap: 'wrap' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: `1px solid ${t.border2}`, borderRadius: 10, color: t.text, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => setShowThemes(!showThemes)}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.accent, flexShrink: 0 }} />
            Theme
          </button>
          <button style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border2}`, borderRadius: 10, color: t.text, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit profile'}</button>
          <button style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 10, color: t.text3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      {/* THEME PICKER */}
      {showThemes && (
        <div style={{ margin: '16px 20px 0', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 10, color: t.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: 12 }}>Choose your theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {allThemes.map(th => (
              <div key={th.id}
                style={{ borderRadius: 12, border: `2px solid ${themeId === th.id ? th.accent : th.border}`, padding: '10px 8px', cursor: 'pointer', background: th.bg, boxShadow: themeId === th.id ? `0 0 0 1px ${th.accent}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                onClick={() => setTheme(th.id)}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: th.accent, border: `2px solid ${th.surface}` }} />
                <div style={{ fontSize: 9, color: th.text, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{th.label}</div>
                {themeId === th.id && <div style={{ fontSize: 9, color: th.accent }}>✓</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFO */}
      <div style={{ padding: '16px 20px 0' }}>
        {editing ? (
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={{ width: '100%', padding: '12px 14px', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 12, color: t.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus />
            <textarea style={{ width: '100%', padding: '12px 14px', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 12, color: t.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
              placeholder="Bio — tell people who you are" value={bio} onChange={e => setBio(e.target.value)} />
            <button style={{ padding: 12, background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        ) : (
          <>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.02em', marginBottom: 2 }}>{name}</div>
            <div style={{ fontSize: 13, color: t.text3, marginBottom: 8 }}>@{profile.username}</div>
            {profile.bio && <div style={{ fontSize: 14, color: t.text2, lineHeight: 1.6 }}>{profile.bio}</div>}
          </>
        )}
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 20px 0', background: t.pillBg, border: `1px solid ${t.border2}`, borderRadius: 16, padding: 16 }}>
        {[['Created', rooms.length], ['Joined', joinedRooms.length], ['Total', rooms.length + joinedRooms.length]].map(([label, num], i) => (
          <>
            {i > 0 && <div key={`d${i}`} style={{ width: 1, height: 32, background: t.border2 }} />}
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: t.text }}>{num}</div>
              <div style={{ fontSize: 10, color: t.text3, marginTop: 2, fontFamily: "'Space Mono',monospace" }}>{label}</div>
            </div>
          </>
        ))}
      </div>

      {/* Hidden cover input */}
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadRoomCover} />

      {/* CREATED ROOMS */}
      {rooms.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: t.text3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Space Mono',monospace" }}>
            <span>Created by you</span><div style={{ flex: 1, height: 1, background: t.border }} />
          </div>
          {rooms.map(room => (
            <div key={room.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, marginBottom: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, position: 'relative', cursor: 'pointer', overflow: 'hidden', background: `linear-gradient(135deg,${t.surface2},${t.bg3})` }}
                onClick={e => triggerCoverUpload(e, room)}>
                {room.cover_image && (
                  <img src={room.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {uploadingCover === room.id ? '⏳' : '📷'}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/room/${room.id}`)}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 2 }}>{room.name}</div>
                {room.topic && <div style={{ fontSize: 12, color: t.text3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{room.topic}</div>}
                <div style={{ fontSize: 10, color: t.text3, marginTop: 3, fontFamily: "'Space Mono',monospace", opacity: 0.6 }}>tap image to change cover</div>
              </div>
              <div style={{ cursor: 'pointer', padding: 4 }} onClick={() => navigate(`/room/${room.id}`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOINED ROOMS */}
      {joinedRooms.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: t.text3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Space Mono',monospace" }}>
            <span>Joined</span><div style={{ flex: 1, height: 1, background: t.border }} />
          </div>
          {joinedRooms.map(room => (
            <div key={room.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, marginBottom: 8, cursor: 'pointer' }}
              onClick={() => navigate(`/room/${room.id}`)}>
              <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg,${t.surface2},${t.bg3})` }}>
                {room.cover_image && (
                  <img src={room.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 2 }}>{room.name}</div>
                {room.topic && <div style={{ fontSize: 12, color: t.text3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{room.topic}</div>}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}
        </div>
      )}

      {rooms.length === 0 && joinedRooms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 15, color: t.text3, marginBottom: 16 }}>No rooms yet</div>
          <button style={{ padding: '12px 24px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => navigate('/')}>Find a conversation</button>
        </div>
      )}

      <div style={{ height: 100 }} />
      <BottomNav />
    </div>
  )
}