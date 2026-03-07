import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'

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
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchConv()
    fetchMessages()

    const channel = supabase
      .channel(`dm_${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'dm_messages',
        filter: `conversation_id=eq.${convId}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [convId])

  async function fetchConv() {
    const { data } = await supabase
      .from('dm_conversations').select('user_a, user_b').eq('id', convId).single()
    if (!data) return
    const otherId = data.user_a === session.user.id ? data.user_b : data.user_a
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single()
    setOtherUser(profile)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
  }

  async function sendMessage() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')

    await supabase.from('dm_messages').insert({
      conversation_id: convId,
      sender_id: session.user.id,
      content,
    })

    // Update last_message_at on conversation
    await supabase.from('dm_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convId)

    setSending(false)
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  const otherName = otherUser?.display_name || otherUser?.username || 'Someone'

  // Group consecutive messages by sender
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    const isMe = msg.sender_id === session.user.id
    const sameSenderAsPrev = prev && prev.sender_id === msg.sender_id
    acc.push({ ...msg, isMe, sameSenderAsPrev })
    return acc
  }, [])

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/messages')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={s.headerUser} onClick={() => otherUser && navigate(`/user/${otherUser.id}`)}>
          <div style={s.headerAvatar}>
            {otherUser?.avatar_url
              ? <img src={otherUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={otherName} />
              : <span style={s.headerAvatarText}>{getInitials(otherName)}</span>
            }
          </div>
          <div>
            <div style={s.headerName}>{otherName}</div>
            {otherUser?.username && <div style={s.headerUsername}>@{otherUser.username}</div>}
          </div>
        </div>
        <div style={{ width: '34px' }} />
      </div>

      {/* MESSAGES */}
      <div style={s.msgArea}>
        {grouped.length === 0 && (
          <div style={s.emptyChat}>
            <div style={s.emptyChatIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(192,0,58,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div style={s.emptyChatText}>Start the conversation with {otherName.split(' ')[0]}</div>
          </div>
        )}

        {grouped.map((msg, i) => {
          const isLast = i === grouped.length - 1 || grouped[i + 1]?.sender_id !== msg.sender_id
          return (
            <div key={msg.id} style={{
              ...s.msgWrap,
              justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
              marginBottom: isLast ? '12px' : '2px',
            }}>
              {!msg.isMe && !msg.sameSenderAsPrev && (
                <div style={s.otherAvatar}>
                  {otherUser?.avatar_url
                    ? <img src={otherUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={otherName} />
                    : <span style={s.otherAvatarText}>{getInitials(otherName)}</span>
                  }
                </div>
              )}
              {!msg.isMe && msg.sameSenderAsPrev && <div style={s.avatarSpacer} />}

              <div style={{
                ...s.bubble,
                ...(msg.isMe ? s.bubbleMe : s.bubbleThem),
                borderRadius: msg.isMe
                  ? (msg.sameSenderAsPrev ? '16px 6px 6px 16px' : '16px 6px 16px 16px')
                  : (msg.sameSenderAsPrev ? '6px 16px 16px 6px' : '6px 16px 16px 6px'),
              }}>
                <div style={s.bubbleText}>{msg.content}</div>
                {isLast && <div style={{ ...s.bubbleTime, textAlign: msg.isMe ? 'right' : 'left' }}>{timeAgo(msg.created_at)}</div>}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputBar}>
        <textarea
          ref={inputRef}
          style={s.input}
          placeholder={`Message ${otherName.split(' ')[0]}...`}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          style={{ ...s.sendBtn, opacity: text.trim() ? 1 : 0.4 }}
          onClick={sendMessage}
          disabled={!text.trim() || sending}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

const s = {
  wrap: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#070003', color: '#f5e0ea', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 14px', borderBottom: '1px solid rgba(192,0,58,0.1)', flexShrink: 0, background: '#070003' },
  backBtn: { width: '34px', height: '34px', borderRadius: '10px', background: '#1a0010', border: '1px solid rgba(245,224,234,0.07)', color: '#f5e0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  headerUser: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  headerAvatar: { width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#c0003a,#900030)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  headerAvatarText: { fontFamily: "'Space Mono',monospace", fontSize: '10px', fontWeight: '700', color: 'white' },
  headerName: { fontSize: '15px', fontWeight: '600', color: '#f5e0ea', lineHeight: 1.2 },
  headerUsername: { fontSize: '11px', color: 'rgba(245,224,234,0.35)' },
  msgArea: { flex: 1, overflowY: 'auto', padding: '16px 14px 8px', display: 'flex', flexDirection: 'column' },
  emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center', padding: '40px 20px' },
  emptyChatIcon: { marginBottom: '4px' },
  emptyChatText: { fontSize: '14px', color: 'rgba(245,224,234,0.3)', lineHeight: 1.5 },
  msgWrap: { display: 'flex', alignItems: 'flex-end', gap: '7px' },
  otherAvatar: { width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg,#c0003a,#900030)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  otherAvatarText: { fontFamily: "'Space Mono',monospace", fontSize: '7px', fontWeight: '700', color: 'white' },
  avatarSpacer: { width: '26px', flexShrink: 0 },
  bubble: { maxWidth: '72%', padding: '9px 13px' },
  bubbleMe: { background: 'linear-gradient(135deg,#c0003a,#900030)', borderRadius: '16px 6px 16px 16px' },
  bubbleThem: { background: '#1a0010', border: '1px solid rgba(192,0,58,0.15)', borderRadius: '6px 16px 16px 6px' },
  bubbleText: { fontSize: '14px', color: '#f5e0ea', lineHeight: 1.5, wordBreak: 'break-word' },
  bubbleTime: { fontSize: '9px', color: 'rgba(245,224,234,0.35)', marginTop: '4px', fontFamily: "'Space Mono',monospace" },
  inputBar: { display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '12px 14px 24px', borderTop: '1px solid rgba(192,0,58,0.1)', background: '#070003', flexShrink: 0 },
  input: { flex: 1, padding: '11px 14px', background: '#1a0010', border: '1px solid rgba(192,0,58,0.2)', borderRadius: '14px', color: '#f5e0ea', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: '120px', lineHeight: 1.5 },
  sendBtn: { width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
}