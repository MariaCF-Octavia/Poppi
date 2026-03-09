import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

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
  const { theme: t } = useTheme()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
    const channel = supabase.channel('dm_inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages' }, () => fetchConversations())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchConversations() {
    const uid = session.user.id
    const { data: convs } = await supabase.from('dm_conversations')
      .select('id, user_a, user_b, last_message_at, created_at')
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .order('last_message_at', { ascending: false })

    if (!convs || convs.length === 0) { setConversations([]); setLoading(false); return }

    const enriched = await Promise.all(convs.map(async conv => {
      const otherId = conv.user_a === uid ? conv.user_b : conv.user_a
      const [{ data: profile }, { data: lastMsgs }] = await Promise.all([
        supabase.from('profiles').select('display_name, username, avatar_url').eq('id', otherId).single(),
        supabase.from('dm_messages').select('content, created_at, sender_id').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1),
      ])
      return { ...conv, otherId, otherProfile: profile, lastMsg: lastMsgs?.[0] }
    }))

    setConversations(enriched); setLoading(false)
  }

  function getInitials(name) { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }
  function getAvatarColor(username) {
    const palette = [t.accent, '#7c2d5e', '#9b1d47', '#2060c0', '#1a7a4a']
    let hash = 0; for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 16px', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: t.bg, zIndex: 10 }}>
        <button style={{ width: '34px', height: '34px', borderRadius: '10px', background: t.surface, border: `1px solid ${t.border}`, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '20px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em' }}>Messages</div>
        <div style={{ width: '34px' }} />
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 32px' }}>
          <div style={{ fontSize: '13px', color: t.text3 }}>Loading...</div>
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: '12px', textAlign: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <div style={{ fontSize: '16px', fontWeight: '600', color: t.text }}>No messages yet</div>
          <div style={{ fontSize: '13px', color: t.text3, lineHeight: 1.6 }}>Go into a room, tap someone's name, and send them a message.</div>
        </div>
      )}

      {!loading && conversations.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          {conversations.map(conv => {
            const name = conv.otherProfile?.display_name || conv.otherProfile?.username || 'Someone'
            const username = conv.otherProfile?.username || ''
            const avatarUrl = conv.otherProfile?.avatar_url
            const lastMsg = conv.lastMsg
            const isMe = lastMsg?.sender_id === session.user.id

            return (
              <div key={conv.id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}
                onClick={() => navigate(`/messages/${conv.id}`)}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: getAvatarColor(username), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                    : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: t.text }}>{name}</span>
                    {lastMsg && <span style={{ fontSize: '10px', color: t.text3, fontFamily: "'Space Mono',monospace" }}>{timeAgo(lastMsg.created_at)}</span>}
                  </div>
                  {lastMsg
                    ? <div style={{ fontSize: '13px', color: t.text3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {isMe && <span style={{ color: t.accent, opacity: 0.7 }}>You: </span>}
                        {lastMsg.content.length > 60 ? lastMsg.content.slice(0, 60) + '…' : lastMsg.content}
                      </div>
                    : <div style={{ fontSize: '13px', color: t.text3, fontStyle: 'italic' }}>Start the conversation</div>
                  }
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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