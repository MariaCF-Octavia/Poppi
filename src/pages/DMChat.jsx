import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function DMChat({ session }) {
  const { convId } = useParams()
  const navigate = useNavigate()
  const { theme: t } = useTheme()
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    fetchConv()
    fetchMessages()
    const channel = supabase.channel(`dm_${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `conversation_id=eq.${convId}` }, payload => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [convId, userId])

  async function fetchConv() {
    if (!userId) return
    const { data } = await supabase.from('dm_conversations').select('user_a, user_b').eq('id', convId).single()
    if (!data) return
    const otherId = data.user_a === userId ? data.user_b : data.user_a
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single()
    setOtherUser(profile)
  }

  async function fetchMessages() {
    const { data } = await supabase.from('dm_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
  }

  async function sendMessage() {
    const content = text.trim()
    if (!content || sending || !userId) return
    setSending(true); setText('')
    await supabase.from('dm_messages').insert({ conversation_id: convId, sender_id: userId, content })
    await supabase.from('dm_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convId)
    setSending(false); inputRef.current?.focus()
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  function getInitials(name) { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }

  const otherName = otherUser?.display_name || otherUser?.username || 'Someone'

  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    acc.push({ ...msg, isMe: msg.sender_id === userId, sameSenderAsPrev: prev && prev.sender_id === msg.sender_id })
    return acc
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 14px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, background: t.bg }}>
        <button style={{ width: '34px', height: '34px', borderRadius: '10px', background: t.surface, border: `1px solid ${t.border}`, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/messages')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => otherUser && navigate(`/user/${otherUser.id}`)}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {otherUser?.avatar_url
              ? <img src={otherUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={otherName} />
              : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '10px', fontWeight: '700', color: 'white' }}>{getInitials(otherName)}</span>
            }
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: t.text, lineHeight: 1.2 }}>{otherName}</div>
            {otherUser?.username && <div style={{ fontSize: '11px', color: t.text3 }}>@{otherUser.username}</div>}
          </div>
        </div>
        <div style={{ width: '34px' }} />
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', display: 'flex', flexDirection: 'column' }}>
        {grouped.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center', padding: '40px 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div style={{ fontSize: '14px', color: t.text3, lineHeight: 1.5 }}>Start the conversation with {otherName.split(' ')[0]}</div>
          </div>
        )}

        {grouped.map((msg, i) => {
          const isLast = i === grouped.length - 1 || grouped[i + 1]?.sender_id !== msg.sender_id
          return (
            <div key={msg.id} style={{
              display: 'flex', alignItems: 'flex-end', gap: '7px',
              justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
              marginBottom: isLast ? '12px' : '2px',
            }}>
              {!msg.isMe && !msg.sameSenderAsPrev && (
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {otherUser?.avatar_url
                    ? <img src={otherUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={otherName} />
                    : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '7px', fontWeight: '700', color: 'white' }}>{getInitials(otherName)}</span>
                  }
                </div>
              )}
              {!msg.isMe && msg.sameSenderAsPrev && <div style={{ width: '26px', flexShrink: 0 }} />}

              <div style={{
                maxWidth: '72%', padding: '9px 13px',
                background: msg.isMe ? `linear-gradient(135deg,${t.accent},${t.accent2})` : t.surface,
                border: msg.isMe ? 'none' : `1px solid ${t.border}`,
                borderRadius: msg.isMe
                  ? (msg.sameSenderAsPrev ? '16px 6px 6px 16px' : '16px 6px 16px 16px')
                  : (msg.sameSenderAsPrev ? '6px 16px 16px 6px' : '6px 16px 16px 6px'),
              }}>
                <div style={{ fontSize: '14px', color: msg.isMe ? '#fff' : t.text, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                {isLast && <div style={{ fontSize: '9px', color: msg.isMe ? 'rgba(255,255,255,0.5)' : t.text3, marginTop: '4px', fontFamily: "'Space Mono',monospace", textAlign: msg.isMe ? 'right' : 'left' }}>{timeAgo(msg.created_at)}</div>}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '12px 14px 24px', borderTop: `1px solid ${t.border}`, background: t.bg, flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          style={{ flex: 1, padding: '11px 14px', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: '14px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: '120px', lineHeight: 1.5 }}
          placeholder={`Message ${otherName.split(' ')[0]}...`}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: text.trim() ? 1 : 0.4, transition: 'opacity 0.15s' }}
          onClick={sendMessage}
          disabled={!text.trim() || sending}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}