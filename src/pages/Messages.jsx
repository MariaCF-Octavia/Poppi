import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function Messages({ session }) {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()

    // Realtime: refresh on new messages
    const channel = supabase
      .channel('dm_inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchConversations() {
    const uid = session.user.id

    const { data: convs } = await supabase
      .from('dm_conversations')
      .select('id, user_a, user_b, last_message_at, created_at')
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .order('last_message_at', { ascending: false })

    if (!convs || convs.length === 0) { setConversations([]); setLoading(false); return }

    // For each conversation, fetch the other person's profile + last message
    const enriched = await Promise.all(convs.map(async conv => {
      const otherId = conv.user_a === uid ? conv.user_b : conv.user_a
      const [{ data: profile }, { data: lastMsgs }] = await Promise.all([
        supabase.from('profiles').select('display_name, username, avatar_url').eq('id', otherId).single(),
        supabase.from('dm_messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ])
      const lastMsg = lastMsgs?.[0]
      return { ...conv, otherId, otherProfile: profile, lastMsg }
    }))

    setConversations(enriched)
    setLoading(false)
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  function getAvatarColor(username) {
    const palette = ['#c0003a', '#7c2d5e', '#9b1d47', '#2060c0', '#1a7a4a']
    let hash = 0
    for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={s.headerTitle}>Messages</div>
        <div style={{ width: '34px' }} />
      </div>

      {loading && (
        <div style={s.empty}>
          <div style={s.emptyText}>Loading...</div>
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(192,0,58,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={s.emptyTitle}>No messages yet</div>
          <div style={s.emptyText}>Go into a room, tap someone's name, and send them a message.</div>
        </div>
      )}

      {!loading && conversations.length > 0 && (
        <div style={s.list}>
          {conversations.map(conv => {
            const name = conv.otherProfile?.display_name || conv.otherProfile?.username || 'Someone'
            const username = conv.otherProfile?.username || ''
            const avatarUrl = conv.otherProfile?.avatar_url
            const lastMsg = conv.lastMsg
            const isMe = lastMsg?.sender_id === session.user.id

            return (
              <div key={conv.id} style={s.convRow} onClick={() => navigate(`/messages/${conv.id}`)}>
                <div style={{ ...s.avatar, background: getAvatarColor(username) }}>
                  {avatarUrl
                    ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                    : <span style={s.avatarText}>{getInitials(name)}</span>
                  }
                </div>
                <div style={s.convInfo}>
                  <div style={s.convTop}>
                    <span style={s.convName}>{name}</span>
                    {lastMsg && <span style={s.convTime}>{timeAgo(lastMsg.created_at)}</span>}
                  </div>
                  {lastMsg
                    ? <div style={s.convPreview}>
                        {isMe && <span style={s.convPreviewYou}>You: </span>}
                        {lastMsg.content.length > 60 ? lastMsg.content.slice(0, 60) + '…' : lastMsg.content}
                      </div>
                    : <div style={s.convPreviewEmpty}>Start the conversation</div>
                  }
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,224,234,0.18)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', background: '#070003', color: '#f5e0ea', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 16px', borderBottom: '1px solid rgba(192,0,58,0.1)', position: 'sticky', top: 0, background: '#070003', zIndex: 10 },
  backBtn: { width: '34px', height: '34px', borderRadius: '10px', background: '#1a0010', border: '1px solid rgba(245,224,234,0.07)', color: '#f5e0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  headerTitle: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: '20px', fontWeight: '700', color: '#f5e0ea', letterSpacing: '-0.02em' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: '12px', textAlign: 'center' },
  emptyIcon: { marginBottom: '4px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#f5e0ea' },
  emptyText: { fontSize: '13px', color: 'rgba(245,224,234,0.35)', lineHeight: 1.6 },
  list: { padding: '8px 0' },
  convRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(192,0,58,0.06)' },
  avatar: { width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  avatarText: { fontFamily: "'Space Mono',monospace", fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '3px' },
  convName: { fontSize: '15px', fontWeight: '600', color: '#f5e0ea' },
  convTime: { fontSize: '10px', color: 'rgba(245,224,234,0.3)', fontFamily: "'Space Mono',monospace" },
  convPreview: { fontSize: '13px', color: 'rgba(245,224,234,0.4)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  convPreviewYou: { color: 'rgba(192,0,58,0.7)' },
  convPreviewEmpty: { fontSize: '13px', color: 'rgba(245,224,234,0.2)', fontStyle: 'italic' },
}