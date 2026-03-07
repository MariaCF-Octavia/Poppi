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

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😡', '👏', '🔥']

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Room({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [seeded, setSeeded] = useState(false)
  const [reactions, setReactions] = useState({})
  const [myReactions, setMyReactions] = useState({})
  const [reactionPicker, setReactionPicker] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [, setTick] = useState(0)
  const bottomRef = useRef(null)
  const messagesRef = useRef([])
  const roomNameRef = useRef(null)
  const seededRef = useRef(false)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)
  const presenceChannelRef = useRef(null)

  // Refresh timestamps every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetchRoom()
    fetchMessages()

    // Messages realtime
    const msgChannel = supabase
      .channel(`room-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${id}`
      }, async payload => {
        const { data: prof } = await supabase
          .from('profiles').select('username, display_name, avatar_url')
          .eq('id', payload.new.user_id).single()
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

    // Typing presence
    const presenceChannel = supabase.channel(`typing-${id}`, {
      config: { presence: { key: session.user.id } }
    })
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const typers = Object.values(state).flat()
          .filter(p => p.user_id !== session.user.id && p.typing)
          .map(p => p.name)
        setTypingUsers([...new Set(typers)])
      })
      .subscribe()
    presenceChannelRef.current = presenceChannel

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handler = () => setReactionPicker(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

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
      setSeeded(data.length > 0)
      seededRef.current = data.length > 0
      if (data.length > 0) fetchReactions(data.map(m => m.id))
    }
  }

  async function fetchReactions(msgIds) {
    if (!msgIds || msgIds.length === 0) return
    const { data } = await supabase.from('reactions').select('*').in('message_id', msgIds)
    if (data) {
      const rxns = {}
      const mine = {}
      data.forEach(r => {
        if (!rxns[r.message_id]) rxns[r.message_id] = {}
        rxns[r.message_id][r.emoji] = (rxns[r.message_id][r.emoji] || 0) + 1
        if (r.user_id === session.user.id) mine[r.message_id] = r.emoji
      })
      setReactions(rxns)
      setMyReactions(mine)
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
      await supabase.from('messages').insert({ room_id: id, user_id: botUserId, content: seed.text })
    }
  }

  async function handleTyping(e) {
    setNewMsg(e.target.value)
    if (!presenceChannelRef.current) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      const { data: prof } = await supabase.from('profiles').select('display_name, username').eq('id', session.user.id).single()
      presenceChannelRef.current.track({ user_id: session.user.id, name: prof?.display_name || prof?.username || 'Someone', typing: true })
    }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      presenceChannelRef.current?.track({ user_id: session.user.id, name: '', typing: false })
    }, 2000)
  }

  async function toggleReaction(msgId, emoji, e) {
    e.stopPropagation()
    setReactionPicker(null)
    const existing = myReactions[msgId]
    if (existing === emoji) {
      await supabase.from('reactions').delete().eq('message_id', msgId).eq('user_id', session.user.id)
      setMyReactions(prev => { const n = {...prev}; delete n[msgId]; return n })
      setReactions(prev => {
        const n = JSON.parse(JSON.stringify(prev))
        if (n[msgId]?.[emoji]) { n[msgId][emoji]--; if (n[msgId][emoji] <= 0) delete n[msgId][emoji] }
        return n
      })
    } else {
      if (existing) await supabase.from('reactions').delete().eq('message_id', msgId).eq('user_id', session.user.id)
      const { error } = await supabase.from('reactions').insert({ message_id: msgId, user_id: session.user.id, emoji })
      if (!error) {
        setMyReactions(prev => ({...prev, [msgId]: emoji}))
        setReactions(prev => {
          const n = JSON.parse(JSON.stringify(prev))
          if (!n[msgId]) n[msgId] = {}
          if (existing && n[msgId][existing]) { n[msgId][existing]--; if (n[msgId][existing] <= 0) delete n[msgId][existing] }
          n[msgId][emoji] = (n[msgId][emoji] || 0) + 1
          return n
        })
      }
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    isTypingRef.current = false
    clearTimeout(typingTimeoutRef.current)
    presenceChannelRef.current?.track({ user_id: session.user.id, name: '', typing: false })
    await supabase.from('messages').insert({ room_id: id, user_id: session.user.id, content: newMsg.trim() })
    setNewMsg('')
    inputRef.current?.focus()
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  function getAvatarColor(username) {
    const palette = ['#c0003a','#7c2d5e','#9b1d47','#2060c0','#1a7a4a','#8B4513','#4B0082','#006666']
    let hash = 0
    for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

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
    <div style={{background:'#070003',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(245,224,234,0.4)',fontFamily:"'DM Sans',sans-serif",fontSize:'14px'}}>
      Loading...
    </div>
  )

  const messageGroups = groupMessages(messages)

  return (
    <div style={s.wrap} onClick={() => setReactionPicker(null)}>

      {/* HEADER */}
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
            <div style={s.headerSub}>{room.is_private ? 'Private room' : 'Public room'}</div>
          </div>
        </div>
        <div style={s.livePill}><div style={s.liveDot} />LIVE</div>
      </div>

      {/* TOPIC CARD */}
      {room.topic && (
        <div style={s.topicCard}>
          <div style={s.topicAccent} />
          <div style={s.topicInner}>
            <div style={s.topicLabel}>Today's topic</div>
            <div style={s.topicText}>{room.topic}</div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div style={s.msgs}>
        {messages.length === 0 && <div style={s.emptyState}>Starting conversation...</div>}

        {messageGroups.map((group, gi) => {
          const isOwn = group.user_id === session.user.id
          const name = group.profile?.display_name || group.profile?.username || 'Unknown'
          const username = group.profile?.username || ''
          const avatarUrl = group.profile?.avatar_url

          return (
            <div key={gi} style={{...s.msgGroup, flexDirection: isOwn ? 'row-reverse' : 'row'}}>
              <div style={{...s.msgAv, background: isOwn ? 'linear-gradient(135deg,#c0003a,#900030)' : getAvatarColor(username)}}>
                {avatarUrl
                  ? <img src={avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name} />
                  : <span style={s.msgAvText}>{getInitials(name)}</span>
                }
              </div>

              <div style={{maxWidth:'76%',display:'flex',flexDirection:'column',gap:'3px',alignItems: isOwn ? 'flex-end' : 'flex-start'}}>
                <div style={{...s.msgMeta, flexDirection: isOwn ? 'row-reverse' : 'row'}}>
                  <span style={s.msgName}>{isOwn ? 'You' : name}</span>
                  <span style={s.msgTime}>{timeAgo(group.msgs[0].created_at)}</span>
                </div>

                {group.msgs.map((msg, mi) => {
                  const msgReactions = reactions[msg.id] || {}
                  const hasReactions = Object.keys(msgReactions).some(k => msgReactions[k] > 0)
                  const isLast = mi === group.msgs.length - 1

                  return (
                    <div key={msg.id} style={{position:'relative',display:'flex',flexDirection:'column',alignItems: isOwn ? 'flex-end' : 'flex-start'}}>
                      <div style={{position:'relative'}}>
                        <div style={{
                          ...s.bubble,
                          background: isOwn ? 'linear-gradient(135deg,#c0003a,#900030)' : '#1a0010',
                          borderBottomRightRadius: isOwn && isLast ? 4 : 14,
                          borderBottomLeftRadius: !isOwn && isLast ? 4 : 14,
                          borderTopLeftRadius: !isOwn && mi === 0 ? 4 : 14,
                          borderTopRightRadius: isOwn && mi === 0 ? 4 : 14,
                          color: isOwn ? '#fff' : '#f5e0ea',
                          border: isOwn ? 'none' : '1px solid rgba(192,0,58,0.15)',
                          paddingRight: isLast ? '32px' : '13px',
                        }}>
                          {msg.content}
                        </div>
                        {isLast && (
                          <button
                            style={{...s.reactBtn, [isOwn ? 'left' : 'right']: '6px'}}
                            onClick={e => { e.stopPropagation(); setReactionPicker(reactionPicker === msg.id ? null : msg.id) }}
                          >+</button>
                        )}
                      </div>

                      {reactionPicker === msg.id && (
                        <div style={{...s.emojiPicker, [isOwn ? 'right' : 'left']: 0}} onClick={e => e.stopPropagation()}>
                          {REACTION_EMOJIS.map(emoji => (
                            <button key={emoji}
                              style={{...s.emojiBtn, background: myReactions[msg.id] === emoji ? 'rgba(192,0,58,0.25)' : 'transparent'}}
                              onClick={e => toggleReaction(msg.id, emoji, e)}
                            >{emoji}</button>
                          ))}
                        </div>
                      )}

                      {hasReactions && (
                        <div style={{...s.reactionRow, justifyContent: isOwn ? 'flex-end' : 'flex-start'}}>
                          {Object.entries(msgReactions).filter(([,c]) => c > 0).map(([emoji, count]) => (
                            <button key={emoji}
                              style={{...s.reactionChip, background: myReactions[msg.id] === emoji ? 'rgba(192,0,58,0.2)' : 'rgba(255,255,255,0.06)', borderColor: myReactions[msg.id] === emoji ? 'rgba(192,0,58,0.4)' : 'rgba(255,255,255,0.1)'}}
                              onClick={e => toggleReaction(msg.id, emoji, e)}
                            >{emoji} <span style={{fontSize:'10px',marginLeft:'2px'}}>{count}</span></button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={s.typingRow}>
            <div style={s.typingDots}>
              <div style={{...s.typingDot, animationDelay:'0ms'}} />
              <div style={{...s.typingDot, animationDelay:'160ms'}} />
              <div style={{...s.typingDot, animationDelay:'320ms'}} />
            </div>
            <span style={s.typingText}>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0,-1).join(', ')} and ${typingUsers[typingUsers.length-1]} are typing...`}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <form style={s.inputArea} onSubmit={sendMessage}>
        <input
          ref={inputRef}
          style={s.input}
          placeholder="Say something..."
          value={newMsg}
          onChange={handleTyping}
          autoComplete="off"
        />
        <button style={{...s.sendBtn, opacity: newMsg.trim() ? 1 : 0.4}} type="submit" disabled={!newMsg.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>

      <style>{`
        @keyframes typingBounce {
          0%,60%,100% { transform:translateY(0); opacity:0.4; }
          30% { transform:translateY(-4px); opacity:1; }
        }
      `}</style>
    </div>
  )
}

const s = {
  wrap: { height:'100vh', display:'flex', flexDirection:'column', background:'#070003', color:'#f5e0ea', fontFamily:"'DM Sans','Helvetica Neue',sans-serif" },
  header: { flexShrink:0, padding:'12px 16px', borderBottom:'1px solid rgba(192,0,58,0.1)', display:'flex', alignItems:'center', gap:'10px', background:'#070003' },
  backBtn: { width:'34px', height:'34px', borderRadius:'10px', background:'#1a0010', border:'1px solid rgba(192,0,58,0.15)', color:'#f5e0ea', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  headerInfo: { flex:1, display:'flex', alignItems:'center', gap:'10px' },
  headerRoomAv: { width:'34px', height:'34px', borderRadius:'10px', background:'#c0003a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  headerRoomAvText: { fontFamily:"'Space Mono',monospace", fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.9)' },
  headerName: { fontFamily:"'Playfair Display',Georgia,serif", fontSize:'15px', fontWeight:'700', color:'#f5e0ea', letterSpacing:'-0.01em' },
  headerSub: { fontSize:'11px', color:'rgba(245,224,234,0.3)' },
  livePill: { display:'flex', alignItems:'center', gap:'5px', fontSize:'9px', fontFamily:"'Space Mono',monospace", color:'#4ade80', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.18)', padding:'4px 10px', borderRadius:'100px', letterSpacing:'0.06em', flexShrink:0 },
  liveDot: { width:'5px', height:'5px', borderRadius:'50%', background:'#4ade80' },
  topicCard: { flexShrink:0, display:'flex', margin:'10px 16px', borderRadius:'12px', background:'rgba(192,0,58,0.06)', border:'1px solid rgba(192,0,58,0.18)', overflow:'hidden' },
  topicAccent: { width:'3px', flexShrink:0, background:'linear-gradient(180deg,#c0003a,#900030)' },
  topicInner: { padding:'10px 14px' },
  topicLabel: { fontSize:'9px', color:'#c0003a', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:'4px', fontFamily:"'Space Mono',monospace" },
  topicText: { fontSize:'13px', color:'#f5e0ea', lineHeight:1.5, fontWeight:'500' },
  msgs: { flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'14px', scrollbarWidth:'none' },
  emptyState: { color:'rgba(245,224,234,0.25)', textAlign:'center', marginTop:'40px', fontSize:'13px', fontStyle:'italic' },
  msgGroup: { display:'flex', alignItems:'flex-end', gap:'8px' },
  msgAv: { width:'30px', height:'30px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' },
  msgAvText: { fontFamily:"'Space Mono',monospace", fontSize:'9px', fontWeight:'700', color:'rgba(255,255,255,0.9)' },
  msgMeta: { display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'2px' },
  msgName: { fontSize:'11px', fontWeight:'600', color:'rgba(245,224,234,0.5)' },
  msgTime: { fontSize:'9px', color:'rgba(245,224,234,0.25)', fontFamily:"'Space Mono',monospace" },
  bubble: { display:'inline-block', padding:'9px 13px', borderRadius:'14px', fontSize:'14px', lineHeight:1.5, maxWidth:'100%', wordBreak:'break-word', position:'relative' },
  reactBtn: { position:'absolute', top:'50%', transform:'translateY(-50%)', width:'20px', height:'20px', borderRadius:'50%', background:'rgba(245,224,234,0.08)', border:'none', color:'rgba(245,224,234,0.4)', fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1 },
  emojiPicker: { position:'absolute', top:'calc(100% + 6px)', zIndex:50, background:'#1a0010', border:'1px solid rgba(192,0,58,0.25)', borderRadius:'16px', padding:'8px 10px', display:'flex', gap:'4px', boxShadow:'0 8px 32px rgba(0,0,0,0.6)' },
  emojiBtn: { width:'32px', height:'32px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' },
  reactionRow: { display:'flex', flexWrap:'wrap', gap:'4px', marginTop:'4px' },
  reactionChip: { display:'flex', alignItems:'center', padding:'3px 8px', borderRadius:'100px', border:'1px solid', cursor:'pointer', fontSize:'13px', color:'#f5e0ea', fontFamily:"'DM Sans',sans-serif" },
  typingRow: { display:'flex', alignItems:'center', gap:'8px', padding:'4px 0' },
  typingDots: { display:'flex', gap:'3px', alignItems:'center' },
  typingDot: { width:'5px', height:'5px', borderRadius:'50%', background:'rgba(245,224,234,0.4)', animation:'typingBounce 1s infinite' },
  typingText: { fontSize:'12px', color:'rgba(245,224,234,0.35)', fontStyle:'italic' },
  inputArea: { flexShrink:0, padding:'10px 16px 20px', borderTop:'1px solid rgba(192,0,58,0.1)', display:'flex', gap:'8px', alignItems:'center', background:'#0e0007' },
  input: { flex:1, background:'#1a0010', border:'1px solid rgba(192,0,58,0.15)', borderRadius:'12px', padding:'12px 16px', color:'#f5e0ea', fontSize:'14px', outline:'none', fontFamily:'inherit' },
  sendBtn: { width:'42px', height:'42px', borderRadius:'12px', background:'linear-gradient(135deg,#c0003a,#900030)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'opacity 0.15s' },
}