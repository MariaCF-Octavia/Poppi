import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Notifications({ session }) {
  const navigate = useNavigate()
  const { theme: t } = useTheme()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchNotifs() }, [])

  async function fetchNotifs() {
    const uid = session.user.id

    // 1. New followers
    const { data: follows } = await supabase
      .from('follows')
      .select('follower_id, created_at')
      .eq('following_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)

    // 2. New DM messages (unread — no read_at)
    const { data: dms } = await supabase
      .from('dm_messages')
      .select('id, content, created_at, sender_id, conversation_id')
      .neq('sender_id', uid)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    const allNotifs = []

    // Enrich follows with profile data
    if (follows && follows.length > 0) {
      const profileIds = [...new Set(follows.map(f => f.follower_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', profileIds)
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

      follows.forEach(f => {
        const profile = profileMap[f.follower_id]
        if (!profile) return
        allNotifs.push({
          id: `follow-${f.follower_id}`,
          type: 'follow',
          profile,
          time: f.created_at,
          userId: f.follower_id,
        })
      })
    }

    // Enrich DMs with sender profile data
    if (dms && dms.length > 0) {
      const senderIds = [...new Set(dms.map(d => d.sender_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', senderIds)
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

      dms.forEach(d => {
        const profile = profileMap[d.sender_id]
        if (!profile) return
        allNotifs.push({
          id: `dm-${d.id}`,
          type: 'dm',
          profile,
          preview: d.content,
          time: d.created_at,
          convId: d.conversation_id,
          userId: d.sender_id,
        })
      })
    }

    // Sort by time desc
    allNotifs.sort((a, b) => new Date(b.time) - new Date(a.time))
    setNotifs(allNotifs)
    setLoading(false)
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  function getAvatarColor(username) {
    const palette = [t.accent, '#7c2d5e', '#9b1d47', '#2060c0', '#1a7a4a']
    let hash = 0; for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  function handleNotifTap(notif) {
    if (notif.type === 'follow') navigate(`/user/${notif.userId}`)
    if (notif.type === 'dm') navigate(`/messages/${notif.convId}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 16px', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: t.bg, zIndex: 10 }}>
        <button style={{ width: '34px', height: '34px', borderRadius: '10px', background: t.surface, border: `1px solid ${t.border}`, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '20px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em' }}>Notifications</div>
        <div style={{ width: '34px' }} />
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 32px' }}>
          <div style={{ fontSize: '13px', color: t.text3 }}>Loading...</div>
        </div>
      )}

      {!loading && notifs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: '12px', textAlign: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div style={{ fontSize: '16px', fontWeight: '600', color: t.text }}>No notifications yet</div>
          <div style={{ fontSize: '13px', color: t.text3, lineHeight: 1.6 }}>When someone follows you or messages you, it'll show up here.</div>
        </div>
      )}

      {!loading && notifs.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          {notifs.map(notif => {
            const name = notif.profile?.display_name || notif.profile?.username || 'Someone'
            const username = notif.profile?.username || ''
            const avatarUrl = notif.profile?.avatar_url

            return (
              <div key={notif.id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}
                onClick={() => handleNotifTap(notif)}>

                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: getAvatarColor(username), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                      : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
                    }
                  </div>
                  {/* Type icon badge */}
                  <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '18px', height: '18px', borderRadius: '6px', background: notif.type === 'follow' ? t.accent : t.surface2, border: `2px solid ${t.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notif.type === 'follow'
                      ? <svg width="9" height="9" viewBox="0 0 24 24" fill="white" strokeWidth="0"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                      : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={t.text2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    }
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: t.text, lineHeight: 1.4, marginBottom: '3px' }}>
                    <span style={{ fontWeight: '600' }}>{name}</span>
                    {notif.type === 'follow' && <span style={{ color: t.text2 }}> started following you</span>}
                    {notif.type === 'dm' && <span style={{ color: t.text2 }}> sent you a message</span>}
                  </div>
                  {notif.type === 'dm' && notif.preview && (
                    <div style={{ fontSize: '13px', color: t.text3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {notif.preview.length > 55 ? notif.preview.slice(0, 55) + '…' : notif.preview}
                    </div>
                  )}
                  {notif.type === 'follow' && (
                    <div style={{ fontSize: '11px', color: t.text3, fontFamily: "'Space Mono',monospace" }}>@{username}</div>
                  )}
                </div>

                {/* Time */}
                <div style={{ fontSize: '10px', color: t.text3, fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{timeAgo(notif.time)}</div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ height: '80px' }} />
      <BottomNav />
    </div>
  )
}