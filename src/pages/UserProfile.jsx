import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function UserProfile({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { theme: t } = useTheme()
  const myId = session?.user?.id
  const isOwnProfile = myId === userId
  const [profile, setProfile] = useState(null)
  const [rooms, setRooms] = useState([])
  const [friendStatus, setFriendStatus] = useState(null)
  const [friendId, setFriendId] = useState(null)
  const [friendCount, setFriendCount] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchRooms()
    if (myId) fetchFriendData()
  }, [userId, myId])

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  async function fetchFriendData() {
    if (!myId) return
    const { data: sent } = await supabase.from('friendships')
      .select('id, status').eq('requester_id', myId).eq('recipient_id', userId).maybeSingle()
    const { data: received } = await supabase.from('friendships')
      .select('id, status').eq('requester_id', userId).eq('recipient_id', myId).maybeSingle()
    if (sent) {
      setFriendId(sent.id)
      setFriendStatus(sent.status === 'accepted' ? 'accepted' : 'pending_sent')
    } else if (received) {
      setFriendId(received.id)
      setFriendStatus(received.status === 'accepted' ? 'accepted' : 'pending_received')
    } else {
      setFriendStatus(null); setFriendId(null)
    }
    const { count } = await supabase.from('friendships').select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`).eq('status', 'accepted')
    setFriendCount(count || 0)
  }

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*').eq('owner_id', userId).eq('is_private', false)
    setRooms(data || [])
  }

  async function sendFriendRequest() {
    if (!myId) return
    setActionLoading(true)
    await supabase.from('friendships').insert({ requester_id: myId, recipient_id: userId })
    setFriendStatus('pending_sent')
    setActionLoading(false)
  }

  async function cancelFriendRequest() {
    setActionLoading(true)
    await supabase.from('friendships').delete().eq('id', friendId)
    setFriendStatus(null); setFriendId(null)
    setActionLoading(false)
  }

  async function acceptFriendRequest() {
    setActionLoading(true)
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendId)
    setFriendStatus('accepted'); setFriendCount(c => c + 1)
    setActionLoading(false)
  }

  async function removeFriend() {
    setActionLoading(true)
    await supabase.from('friendships').delete().eq('id', friendId)
    setFriendStatus(null); setFriendId(null); setFriendCount(c => Math.max(0, c - 1))
    setActionLoading(false)
  }

  async function startDM() {
    if (!myId) return
    const [user_a, user_b] = [myId, userId].sort()
    const { data: existing } = await supabase.from('dm_conversations').select('id').eq('user_a', user_a).eq('user_b', user_b).maybeSingle()
    if (existing) { navigate(`/messages/${existing.id}`); return }
    const { data: created } = await supabase.from('dm_conversations').insert({ user_a, user_b }).select('id').single()
    if (created) navigate(`/messages/${created.id}`)
  }

  function getInitials(name) { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }

  function FriendButton() {
    if (friendStatus === 'accepted') return (
      <button style={{ padding: '8px 18px', background: 'transparent', border: `1px solid ${t.border2}`, borderRadius: '10px', color: t.text2, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={removeFriend} disabled={actionLoading}>{actionLoading ? '...' : 'Friends'}</button>
    )
    if (friendStatus === 'pending_sent') return (
      <button style={{ padding: '8px 18px', background: 'transparent', border: `1px solid ${t.border2}`, borderRadius: '10px', color: t.text3, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={cancelFriendRequest} disabled={actionLoading}>{actionLoading ? '...' : 'Requested'}</button>
    )
    if (friendStatus === 'pending_received') return (
      <button style={{ padding: '8px 18px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={acceptFriendRequest} disabled={actionLoading}>{actionLoading ? '...' : 'Accept'}</button>
    )
    return (
      <button style={{ padding: '8px 18px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={sendFriendRequest} disabled={actionLoading}>{actionLoading ? '...' : 'Add friend'}</button>
    )
  }

  if (!profile) return (
    <div style={{ background: t.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text3, fontFamily: 'DM Sans,sans-serif', fontSize: '14px' }}>
      Loading...
    </div>
  )

  const name = profile.display_name || profile.username || 'Someone'

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: 'DM Sans,Helvetica Neue,sans-serif' }}>

      <div style={{ position: 'relative', height: '160px', overflow: 'hidden', background: `linear-gradient(135deg,${t.surface} 0%,${t.surface2} 50%,${t.surface} 100%)` }}>
        {profile.banner_url && (
          <img src={profile.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.5))' }} />
        <button style={{ position: 'absolute', top: '14px', left: '14px', width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
          onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-36px', position: 'relative', zIndex: 3, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: `3px solid ${t.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
            : <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '20px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
          }
        </div>
        {!isOwnProfile && (
          <div style={{ display: 'flex', gap: '8px', paddingBottom: '6px' }}>
            <FriendButton />
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text2, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={startDM}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Message
            </button>
          </div>
        )}
        {isOwnProfile && (
          <button style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border2}`, borderRadius: '10px', color: t.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '6px' }}
            onClick={() => navigate('/profile')}>Edit profile</button>
        )}
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '22px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em', marginBottom: '2px' }}>{name}</div>
        <div style={{ fontSize: '13px', color: t.text3, marginBottom: '8px' }}>@{profile.username}</div>
        {profile.bio && <div style={{ fontSize: '14px', color: t.text2, lineHeight: 1.6 }}>{profile.bio}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 20px 0', background: t.pillBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px' }}>
        {[['Friends', friendCount], ['Rooms', rooms.length]].map(([label, num], i) => (
          <>
            {i > 0 && <div key={`d${i}`} style={{ width: '1px', height: '32px', background: t.border2 }} />}
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '22px', fontWeight: '700', color: t.text }}>{num}</div>
              <div style={{ fontSize: '10px', color: t.text3, marginTop: '2px', fontFamily: 'Space Mono,monospace' }}>{label}</div>
            </div>
          </>
        ))}
      </div>

      {rooms.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: t.text3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Space Mono,monospace' }}>
            <span>Rooms by {name.split(' ')[0]}</span><div style={{ flex: 1, height: '1px', background: t.border }} />
          </div>
          {rooms.map(room => (
            <div key={room.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', marginBottom: '8px', cursor: 'pointer' }}
              onClick={() => navigate(`/room/${room.id}`)}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg,${t.surface2},${t.bg3})` }}>
                {room.cover_image && <img src={room.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: t.text, marginBottom: '2px' }}>{room.name}</div>
                {room.topic && <div style={{ fontSize: '12px', color: t.text3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{room.topic}</div>}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: '48px' }} />
    </div>
  )
}