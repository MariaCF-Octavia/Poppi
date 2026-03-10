import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Notifications({ session }) {
  const { theme: t } = useTheme()
  const navigate = useNavigate()
  const userId = session?.user?.id
  const [pendingRequests, setPendingRequests] = useState([])
  const [unreadDMs, setUnreadDMs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchAll()
  }, [userId])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchFriendRequests(), fetchUnreadDMs()])
    setLoading(false)
  }

  async function fetchFriendRequests() {
    if (!userId) return
    const { data } = await supabase
      .from('friendships')
      .select('id, created_at, requester_id, profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url)')
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setPendingRequests(data || [])
  }

  async function fetchUnreadDMs() {
    if (!userId) return
    const { data: convos } = await supabase
      .from('dm_conversations')
      .select('id, user_a, user_b, last_message_at')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (!convos || convos.length === 0) { setUnreadDMs([]); return }

    const results = await Promise.all(convos.map(async convo => {
      const otherId = convo.user_a === userId ? convo.user_b : convo.user_a
      const { data: other } = await supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', otherId).single()
      const { data: lastMsg } = await supabase.from('dm_messages').select('content, created_at, read_at, sender_id')
        .eq('conversation_id', convo.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      const { count: unread } = await supabase.from('dm_messages').select('*', { count: 'exact', head: true })
        .eq('conversation_id', convo.id).eq('sender_id', otherId).is('read_at', null)
      return { ...convo, other, lastMsg, unread: unread || 0 }
    }))

    setUnreadDMs(results.filter(r => r.lastMsg))
  }

  async function acceptFriend(friendshipId) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    setPendingRequests(prev => prev.filter(r => r.id !== friendshipId))
  }

  async function declineFriend(friendshipId) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setPendingRequests(prev => prev.filter(r => r.id !== friendshipId))
  }

  function getInitials(name) { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }
  function getAvatarColor(username) {
    const palette = ['#c0003a', '#7c2d5e', '#2060c0', '#1a7a4a', '#8B4513', '#4B0082']
    let hash = 0; for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  const hasAnything = pendingRequests.length > 0 || unreadDMs.length > 0

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div style={{ padding: '20px 20px 12px', position: 'sticky', top: 0, background: t.bg, zIndex: 10, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: t.text }}>Notifications</div>
        <div style={{ fontSize: '11px', color: t.text3, marginTop: '2px' }}>Friend requests and messages</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {loading && <div style={{ textAlign: 'center', padding: '48px 0', color: t.text3, fontSize: '13px', fontStyle: 'italic' }}>Loading...</div>}

        {!loading && !hasAnything && (
          <div style={{ textAlign: 'center', padding: '72px 20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: t.text, marginBottom: '6px' }}>All clear</div>
            <div style={{ fontSize: '13px', color: t.text3 }}>No notifications yet</div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: t.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'Space Mono',monospace" }}>
              <span>Friend requests</span>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', fontWeight: '700' }}>{pendingRequests.length}</div>
              <div style={{ flex: 1, height: '1px', background: t.border }} />
            </div>
            {pendingRequests.map(req => {
              const name = req.profiles?.display_name || req.profiles?.username || 'Someone'
              return (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: t.surface, border: `1px solid ${t.accent}33`, borderRadius: '16px', marginBottom: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: getAvatarColor(req.profiles?.username), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => navigate(`/user/${req.profiles?.id}`)}>
                    {req.profiles?.avatar_url
                      ? <img src={req.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                      : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: t.text, marginBottom: '2px' }}>{name}</div>
                    <div style={{ fontSize: '12px', color: t.text3 }}>wants to be your friend · {timeAgo(req.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button style={{ padding: '7px 14px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: '9px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => acceptFriend(req.id)}>Accept</button>
                    <button style={{ padding: '7px 12px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '9px', color: t.text3, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => declineFriend(req.id)}>Decline</button>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {unreadDMs.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: t.text3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px', marginTop: pendingRequests.length > 0 ? '24px' : '0', fontFamily: "'Space Mono',monospace" }}>
              <span>Messages</span><div style={{ flex: 1, height: '1px', background: t.border }} />
            </div>
            {unreadDMs.map(convo => {
              const name = convo.other?.display_name || convo.other?.username || 'Someone'
              const isMe = convo.lastMsg?.sender_id === userId
              return (
                <div key={convo.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: t.surface, border: `1px solid ${convo.unread > 0 ? t.accent + '44' : t.border}`, borderRadius: '16px', marginBottom: '10px', cursor: 'pointer' }}
                  onClick={() => navigate(`/messages/${convo.id}`)}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: getAvatarColor(convo.other?.username), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {convo.other?.avatar_url
                        ? <img src={convo.other.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                        : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
                      }
                    </div>
                    {convo.unread > 0 && (
                      <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#fff', fontWeight: '700', border: `2px solid ${t.bg}` }}>{convo.unread}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ fontSize: '14px', fontWeight: convo.unread > 0 ? '700' : '600', color: t.text }}>{name}</div>
                      <div style={{ fontSize: '10px', color: t.text3, fontFamily: "'Space Mono',monospace", flexShrink: 0, marginLeft: '8px' }}>{timeAgo(convo.lastMsg?.created_at)}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: convo.unread > 0 ? t.text2 : t.text3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {isMe ? 'You: ' : ''}{convo.lastMsg?.content}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        <div style={{ height: '100px' }} />
      </div>
      <BottomNav />
    </div>
  )
}