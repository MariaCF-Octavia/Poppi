import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

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
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const coverRoomRef = useRef(null)

  useEffect(() => { fetchProfile(); fetchRooms() }, [])

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
    const ext = file.name.split('.').pop()
    const path = `${session.user.id}/${pathKey}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const bust = `${publicUrl}?t=${Date.now()}`
      await supabase.from('profiles').update({ [dbField]: bust }).eq('id', session.user.id)
      await fetchProfile()
    }
    setUploading(false)
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
    const ext = file.name.split('.').pop()
    const path = `room-covers/${room.id}.${ext}`
    await supabase.storage.from('avatars').remove([path])
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('rooms').update({ cover_image: `${publicUrl}?t=${Date.now()}` }).eq('id', room.id)
      await fetchRooms()
    }
    setUploadingCover(null)
    e.target.value = ''
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  if (!profile) return (
    <div style={{ background: '#070003', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,224,234,0.4)', fontFamily: "'DM Sans',sans-serif", fontSize: '14px' }}>Loading...</div>
  )

  const name = profile.display_name || profile.username || 'You'

  return (
    <div style={s.wrap}>

      {/* BANNER */}
      <div style={{
        ...s.banner,
        backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
        background: profile.banner_url ? undefined : 'linear-gradient(135deg,#1a0010 0%,#3d0020 50%,#1a0010 100%)',
      }}>
        <div style={s.bannerOverlay} />
        <button style={s.backBtn} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <button style={s.changeBannerBtn} onClick={() => bannerInputRef.current?.click()}>
          {uploadingBanner ? 'Uploading...' : '📷 Change banner'}
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => uploadImage(e.target.files?.[0], 'banner', 'banner_url', setUploadingBanner)} />
      </div>

      {/* AVATAR ROW */}
      <div style={s.avatarRow}>
        <div style={s.avatarWrap} onClick={() => avatarInputRef.current?.click()}>
          <div style={s.avatar}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
              : <span style={s.avatarInitials}>{getInitials(name)}</span>
            }
          </div>
          <div style={s.avatarBadge}>{uploadingAvatar ? '…' : '✎'}</div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => uploadImage(e.target.files?.[0], 'avatar', 'avatar_url', setUploadingAvatar)} />
        </div>
        <div style={s.headerActions}>
          <button style={s.editBtn} onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit profile'}</button>
          <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      {/* INFO */}
      <div style={s.info}>
        {editing ? (
          <form onSubmit={saveProfile} style={s.editForm}>
            <input style={s.editInput} placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus />
            <textarea style={{ ...s.editInput, minHeight: '80px', resize: 'vertical', lineHeight: 1.5 }} placeholder="Bio — tell people who you are" value={bio} onChange={e => setBio(e.target.value)} />
            <button style={s.saveBtn} type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        ) : (
          <>
            <div style={s.displayName}>{name}</div>
            <div style={s.username}>@{profile.username}</div>
            {profile.bio && <div style={s.bio}>{profile.bio}</div>}
          </>
        )}
      </div>

      {/* STATS */}
      <div style={s.stats}>
        <div style={s.stat}><div style={s.statNum}>{rooms.length}</div><div style={s.statLabel}>Created</div></div>
        <div style={s.statDivider} />
        <div style={s.stat}><div style={s.statNum}>{joinedRooms.length}</div><div style={s.statLabel}>Joined</div></div>
        <div style={s.statDivider} />
        <div style={s.stat}><div style={s.statNum}>{rooms.length + joinedRooms.length}</div><div style={s.statLabel}>Total rooms</div></div>
      </div>

      {/* Hidden cover input */}
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadRoomCover} />

      {/* CREATED ROOMS */}
      {rooms.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionLabel}><span>Created by you</span><div style={s.sectionLine} /></div>
          {rooms.map(room => (
            <div key={room.id} style={s.roomCard}>

              {/* Thumbnail — tap to change cover image */}
              <div
                style={{
                  ...s.roomThumb,
                  backgroundImage: room.cover_image ? `url(${room.cover_image})` : undefined,
                  background: room.cover_image ? undefined : 'linear-gradient(135deg,#1a0010,#3d0020)',
                }}
                onClick={e => triggerCoverUpload(e, room)}
              >
                <div style={s.thumbOverlay}>
                  {uploadingCover === room.id
                    ? <span style={s.thumbIcon}>...</span>
                    : <span style={s.thumbIcon}>📷</span>
                  }
                </div>
              </div>

              {/* Room info — tap to go to room */}
              <div style={s.roomInfo} onClick={() => navigate(`/room/${room.id}`)}>
                <div style={s.roomName}>{room.name}</div>
                {room.topic && <div style={s.roomTopic}>{room.topic}</div>}
                <div style={s.coverHint}>tap image to change cover</div>
              </div>

              {/* Arrow — also navigates to room */}
              <div style={s.arrowWrap} onClick={() => navigate(`/room/${room.id}`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,224,234,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOINED ROOMS */}
      {joinedRooms.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionLabel}><span>Joined</span><div style={s.sectionLine} /></div>
          {joinedRooms.map(room => (
            <div key={room.id} style={s.roomCard} onClick={() => navigate(`/room/${room.id}`)}>
              <div style={{
                ...s.roomThumb,
                backgroundImage: room.cover_image ? `url(${room.cover_image})` : undefined,
                background: room.cover_image ? undefined : 'linear-gradient(135deg,#1a0010,#3d0020)',
              }} />
              <div style={s.roomInfo}>
                <div style={s.roomName}>{room.name}</div>
                {room.topic && <div style={s.roomTopic}>{room.topic}</div>}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,224,234,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}
        </div>
      )}

      {rooms.length === 0 && joinedRooms.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyText}>No rooms yet</div>
          <button style={s.exploreBtn} onClick={() => navigate('/')}>Find a conversation</button>
        </div>
      )}

      <div style={{ height: '40px' }} />
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', background: '#070003', color: '#f5e0ea', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
  banner: { position: 'relative', height: '180px', backgroundSize: 'cover', backgroundPosition: 'center' },
  bannerOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(7,0,3,0.2),rgba(7,0,3,0.5))' },
  backBtn: { position: 'absolute', top: '14px', left: '14px', width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(7,0,3,0.6)', border: '1px solid rgba(245,224,234,0.12)', color: '#f5e0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', zIndex: 2 },
  changeBannerBtn: { position: 'absolute', bottom: '12px', right: '14px', padding: '6px 12px', background: 'rgba(7,0,3,0.6)', border: '1px solid rgba(245,224,234,0.15)', borderRadius: '10px', color: 'rgba(245,224,234,0.7)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(4px)', zIndex: 2 },
  avatarRow: { padding: '0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-36px', position: 'relative', zIndex: 3 },
  avatarWrap: { position: 'relative', cursor: 'pointer' },
  avatar: { width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: '3px solid #070003', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarInitials: { fontFamily: "'Space Mono',monospace", fontSize: '20px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  avatarBadge: { position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderRadius: '6px', background: '#c0003a', border: '2px solid #070003', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' },
  headerActions: { display: 'flex', gap: '8px', paddingBottom: '6px' },
  editBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(192,0,58,0.3)', borderRadius: '10px', color: '#f5e0ea', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  signOutBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(245,224,234,0.1)', borderRadius: '10px', color: 'rgba(245,224,234,0.35)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  info: { padding: '16px 20px 0' },
  displayName: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '22px', fontWeight: '700', color: '#f5e0ea', letterSpacing: '-0.02em', marginBottom: '2px' },
  username: { fontSize: '13px', color: 'rgba(245,224,234,0.35)', marginBottom: '8px' },
  bio: { fontSize: '14px', color: 'rgba(245,224,234,0.65)', lineHeight: 1.6 },
  editForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  editInput: { width: '100%', padding: '12px 14px', background: '#1a0010', border: '1px solid rgba(192,0,58,0.2)', borderRadius: '12px', color: '#f5e0ea', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  saveBtn: { padding: '12px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  stats: { display: 'flex', alignItems: 'center', margin: '20px 20px 0', background: 'rgba(192,0,58,0.06)', border: '1px solid rgba(192,0,58,0.12)', borderRadius: '16px', padding: '16px' },
  stat: { flex: 1, textAlign: 'center' },
  statNum: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '22px', fontWeight: '700', color: '#f5e0ea' },
  statLabel: { fontSize: '10px', color: 'rgba(245,224,234,0.35)', marginTop: '2px', fontFamily: "'Space Mono',monospace" },
  statDivider: { width: '1px', height: '32px', background: 'rgba(192,0,58,0.15)' },
  section: { padding: '24px 20px 0' },
  sectionLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(245,224,234,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'Space Mono',monospace" },
  sectionLine: { flex: 1, height: '1px', background: 'rgba(192,0,58,0.1)' },
  roomCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#0e0007', border: '1px solid rgba(192,0,58,0.1)', borderRadius: '14px', marginBottom: '8px' },
  roomThumb: { width: '48px', height: '48px', borderRadius: '10px', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, position: 'relative', cursor: 'pointer', overflow: 'hidden' },
  thumbOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  thumbIcon: { fontSize: '16px' },
  roomInfo: { flex: 1, minWidth: 0, cursor: 'pointer' },
  roomName: { fontSize: '14px', fontWeight: '600', color: '#f5e0ea', marginBottom: '2px' },
  roomTopic: { fontSize: '12px', color: 'rgba(245,224,234,0.35)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  coverHint: { fontSize: '10px', color: 'rgba(245,224,234,0.2)', marginTop: '3px', fontFamily: "'Space Mono',monospace" },
  arrowWrap: { flexShrink: 0, cursor: 'pointer', padding: '4px' },
  empty: { textAlign: 'center', padding: '48px 20px' },
  emptyText: { fontSize: '15px', color: 'rgba(245,224,234,0.3)', marginBottom: '16px' },
  exploreBtn: { padding: '12px 24px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
}