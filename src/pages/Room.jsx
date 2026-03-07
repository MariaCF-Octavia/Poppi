import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { triggerBotResponse, SEED_MESSAGES, BOTS } from '../lib/bots.js'

const BOT_IDS = {
  zara:   '00000000-0000-0000-0000-000000000001',
  marcus: '00000000-0000-0000-0000-000000000002',
  jay:    '00000000-0000-0000-0000-000000000003',
  amira:  '00000000-0000-0000-0000-000000000004',
  kezia:  '00000000-0000-0000-0000-000000000005',
  dami:   '00000000-0000-0000-0000-000000000006',
  theo:   '00000000-0000-0000-0000-000000000007',
  yemi:   '00000000-0000-0000-0000-000000000008',
  priya:  '00000000-0000-0000-0000-000000000009',
  sol:    '00000000-0000-0000-0000-000000000010',
  bex:    '00000000-0000-0000-0000-000000000011',
  kofi:   '00000000-0000-0000-0000-000000000012',
  nadia:  '00000000-0000-0000-0000-000000000013',
  rio:    '00000000-0000-0000-0000-000000000014',
  cass:   '00000000-0000-0000-0000-000000000015',
  ife:    '00000000-0000-0000-0000-000000000016',
  dan:    '00000000-0000-0000-0000-000000000017',
  sara:   '00000000-0000-0000-0000-000000000018',
  luca:   '00000000-0000-0000-0000-000000000019',
  nova:   '00000000-0000-0000-0000-000000000020',
}

export default function Room({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [seeded, setSeeded] = useState(false)
  const bottomRef = useRef(null)
  const messagesRef = useRef([])
  const roomNameRef = useRef(null)
  const seededRef = useRef(false)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchRoom()
    fetchMessages()

    const channel = supabase
      .channel(`room-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${id}`
      }, async payload => {
        const { data: prof } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single()
        const fullMsg = { ...payload.new, profiles: prof }
        setMessages(prev => {
          if (prev.find(m => m.id === fullMsg.id)) return prev
          const updated = [...prev, fullMsg]
          messagesRef.current = updated
          return updated
        })
        const botUsernames = Object.values(BOTS).map(b => b.username)
        const isBot = botUsernames.includes(prof?.username)
        if (!isBot && roomNameRef.current) {
          triggerBotResponse(roomNameRef.current, id, messagesRef.current, fullMsg)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchRoom() {
    const { data } = await supabase.from('rooms').select('*').eq('id', id).single()
    setRoom(data)
    roomNameRef.current = data?.name
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select(`*, profiles(username, display_name, avatar_url)`)
      .eq('room_id', id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) {
      setMessages(data)
      messagesRef.current = data
      if (data.length === 0) {
        setSeeded(false)
        seededRef.current = false
      } else {
        setSeeded(true)
        seededRef.current = true
      }
    }
  }

  useEffect(() => {
    if (room && !seeded && messages.length === 0 && !seededRef.current) {
      seededRef.current = true
      seedRoom()
    }
  }, [room, seeded, messages.length])

  async function seedRoom() {
    const seeds = SEED_MESSAGES[room.name]
    if (!seeds) return
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]
      const bot = BOTS[seed.bot]
      if (!bot) continue
      const botUserId = BOT_IDS[bot.username]
      if (!botUserId) continue
      await new Promise(r => setTimeout(r, 900 * i))
      await supabase.from('messages').insert({
        room_id: id,
        user_id: botUserId,
        content: seed.text
      })
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    await supabase.from('messages').insert({
      room_id: id,
      user_id: session.user.id,
      content: newMsg.trim()
    })
    setNewMsg('')
    inputRef.current?.focus()
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  function getAvatarColor(username) {
    const palette = ['#c0003a','#7c2d5e','#9b1d47','#2060c0','#1a7a4a']
    let hash = 0
    for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  // Group consecutive messages from same user
  function groupMessages(msgs) {
    const groups = []
    msgs.forEach((msg, i) => {
      const prev = msgs[i - 1]
      const sameUser = prev && prev.user_id === msg.user_id
      const withinMinute = prev && (new Date(msg.created_at) - new Date(prev.created_at)) < 60000
      if (sameUser && withinMinute) {
        groups[groups.length - 1].msgs.push(msg)
      } else {
        groups.push({ user_id: msg.user_id, profile: msg.profiles, msgs: [msg] })
      }
    })
    return groups
  }

  if (!room) return (
    <div style={{background:'#070003', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(245,224,234,0.4)', fontFamily:"'DM Sans', sans-serif", fontSize:'14px'}}>
      Loading...
    </div>
  )

  const messageGroups = groupMessages(messages)

  return (
    <div style={s.wrap}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={s.headerInfo}>
          <div style={s.headerRoomAv}>
            <span style={s.headerRoomAvText}>{getInitials(room.name)}</span>
          </div>
          <div>
            <div style={s.headerName}>{room.name}</div>
            <div style={s.headerSub}>
              {room.is_private ? 'Private room' : 'Public room'}
            </div>
          </div>
        </div>
        <div style={s.livePill}>
          <div style={s.liveDot} />
          LIVE
        </div>
      </div>

      {/* ── TOPIC CARD ── */}
      {room.topic && (
        <div style={s.topicCard}>
          <div style={s.topicAccent} />
          <div style={s.topicInner}>
            <div style={s.topicLabel}>Today's topic</div>
            <div style={s.topicText}>{room.topic}</div>
          </div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div style={s.msgs}>
        {messages.length === 0 && (
          <div style={s.emptyState}>Starting conversation...</div>
        )}

        {messageGroups.map((group, gi) => {
          const isOwn = group.user_id === session.user.id
          const name = group.profile?.display_name || group.profile?.username || 'Unknown'
          const username = group.profile?.username || ''
          const avatarUrl = group.profile?.avatar_url

          return (
            <div key={gi} style={{...s.msgGroup, flexDirection: isOwn ? 'row-reverse' : 'row'}}>
              {/* Avatar - only show for first in group */}
              <div style={{...s.msgAv, background: isOwn ? 'linear-gradient(135deg,#c0003a,#900030)' : getAvatarColor(username)}}>
                {avatarUrl
                  ? <img src={avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name} />
                  : <span style={s.msgAvText}>{getInitials(name)}</span>
                }
              </div>

              <div style={{maxWidth:'76%', display:'flex', flexDirection:'column', gap:'3px', alignItems: isOwn ? 'flex-end' : 'flex-start'}}>
                {/* Name + time */}
                <div style={{...s.msgMeta, flexDirection: isOwn ? 'row-reverse' : 'row'}}>
                  <span style={s.msgName}>{isOwn ? 'You' : name}</span>
                  <span style={s.msgTime}>{formatTime(group.msgs[0].created_at)}</span>
                </div>

                {/* Bubbles */}
                {group.msgs.map((msg, mi) => (
                  <div key={msg.id} style={{
                    ...s.bubble,
                    background: isOwn
                      ? 'linear-gradient(135deg, #c0003a, #900030)'
                      : '#1a0010',
                    borderBottomRightRadius: isOwn && mi === group.msgs.length - 1 ? 4 : 14,
                    borderBottomLeftRadius: !isOwn && mi === group.msgs.length - 1 ? 4 : 14,
                    borderTopLeftRadius: !isOwn && mi === 0 ? 4 : 14,
                    borderTopRightRadius: isOwn && mi === 0 ? 4 : 14,
                    color: isOwn ? '#fff' : '#f5e0ea',
                    border: isOwn ? 'none' : '1px solid rgba(192,0,58,0.15)',
                  }}>
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <form style={s.inputArea} onSubmit={sendMessage}>
        <input
          ref={inputRef}
          style={s.input}
          placeholder={`Say something in ${room.name}...`}
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          autoComplete="off"
        />
        <button style={{...s.sendBtn, opacity: newMsg.trim() ? 1 : 0.4}} type="submit" disabled={!newMsg.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

const s = {
  wrap: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#070003',
    color: '#f5e0ea',
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
  },

  // Header
  header: {
    flexShrink: 0,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(192,0,58,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#070003',
  },
  backBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: '#1a0010',
    border: '1px solid rgba(192,0,58,0.15)',
    color: '#f5e0ea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  headerInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px' },
  headerRoomAv: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: '#c0003a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerRoomAvText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  headerName: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '15px',
    fontWeight: '700',
    color: '#f5e0ea',
    letterSpacing: '-0.01em',
  },
  headerSub: { fontSize: '11px', color: 'rgba(245,224,234,0.3)' },
  livePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '9px',
    fontFamily: "'Space Mono', monospace",
    color: '#4ade80',
    background: 'rgba(74,222,128,0.08)',
    border: '1px solid rgba(74,222,128,0.18)',
    padding: '4px 10px',
    borderRadius: '100px',
    letterSpacing: '0.06em',
    flexShrink: 0,
  },
  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#4ade80',
  },

  // Topic card
  topicCard: {
    flexShrink: 0,
    display: 'flex',
    margin: '10px 16px',
    borderRadius: '12px',
    background: 'rgba(192,0,58,0.06)',
    border: '1px solid rgba(192,0,58,0.18)',
    overflow: 'hidden',
  },
  topicAccent: {
    width: '3px',
    flexShrink: 0,
    background: 'linear-gradient(180deg, #c0003a, #900030)',
  },
  topicInner: { padding: '10px 14px' },
  topicLabel: {
    fontSize: '9px',
    color: '#c0003a',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: '4px',
    fontFamily: "'Space Mono', monospace",
  },
  topicText: {
    fontSize: '13px',
    color: '#f5e0ea',
    lineHeight: 1.5,
    fontWeight: '500',
  },

  // Messages
  msgs: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    scrollbarWidth: 'none',
  },
  emptyState: {
    color: 'rgba(245,224,234,0.25)',
    textAlign: 'center',
    marginTop: '40px',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  msgGroup: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  msgAv: {
    width: '30px',
    height: '30px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  msgAvText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  msgMeta: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginBottom: '2px',
  },
  msgName: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(245,224,234,0.5)',
  },
  msgTime: {
    fontSize: '9px',
    color: 'rgba(245,224,234,0.25)',
    fontFamily: "'Space Mono', monospace",
  },
  bubble: {
    display: 'inline-block',
    padding: '9px 13px',
    borderRadius: '14px',
    fontSize: '14px',
    lineHeight: 1.5,
    maxWidth: '100%',
    wordBreak: 'break-word',
  },

  // Input
  inputArea: {
    flexShrink: 0,
    padding: '10px 16px 20px',
    borderTop: '1px solid rgba(192,0,58,0.1)',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    background: '#0e0007',
  },
  input: {
    flex: 1,
    background: '#1a0010',
    border: '1px solid rgba(192,0,58,0.15)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f5e0ea',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #c0003a, #900030)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
}