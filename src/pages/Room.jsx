import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
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
const MAX_CHARS = 2000

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
  const { theme: t } = useTheme()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [seeded, setSeeded] = useState(false)
  const [reactions, setReactions] = useState({})
  const [myReactions, setMyReactions] = useState({})
  const [reactionPicker, setReactionPicker] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [, setTick] = useState(0)
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef(null)
  const messagesRef = useRef([])
  const roomNameRef = useRef(null)
  const seededRef = useRef(false)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)
  const presenceChannelRef = useRef(null)

  const userId = session?.user?.id

  useEffect(() => {
    const timer = setInterval(() => setTick(n => n + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchRoom(); fetchMessages()

    const msgChannel = supabase.channel(`room-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${id}` }, async payload => {
        const { data: prof } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', payload.new.user_id).single()
        const fullMsg = { ...payload.new, profiles: prof }
        setMessages(prev => {
          if (prev.find(m => m.id === fullMsg.id)) return prev
          const updated = [...prev, fullMsg]; messagesRef.current = updated; return updated
        })
        const botUsernames = Object.values(BOTS).map(b => b.username)
        if (!botUsernames.includes(prof?.username) && roomNameRef.current) {
          triggerBotResponse(roomNameRef.current, id, messagesRef.current, fullMsg)
        }
      }).subscribe()

    const presenceChannel = supabase.channel(`typing-${id}`, { config: { presence: { key: userId } } })
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState()
      const typers = Object.values(state).flat().filter(p => p.user_id !== userId && p.typing).map(p => p.name)
      setTypingUsers([...new Set(typers)])
    }).subscribe()
    presenceChannelRef.current = presenceChannel

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(presenceChannel)
      presenceChannelRef.current = null
    }
  }, [id, userId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    const handler = () => setReactionPicker(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  async function fetchRoom() {
    const { data } = await supabase.from('rooms').select('*').eq('id', id).single()
    setRoom(data); roomNameRef.current = data?.name
  }

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select(`*, profiles(username, display_name, avatar_url)`).eq('room_id', id).order('created_at', { ascending: true }).limit(100)
    if (data) {
      setMessages(data); messagesRef.current = data
      setSeeded(data.length > 0); seededRef.current = data.length > 0
      if (data.length > 0) fetchReactions(data.map(m => m.id))
    }
  }

  async function fetchReactions(msgIds) {
    if (!msgIds || msgIds.length === 0 || !userId) return
    const { data } = await supabase.from('reactions').select('*').in('message_id', msgIds)
    if (data) {
      const rxns = {}; const mine = {}
      data.forEach(r => {
        if (!rxns[r.message_id]) rxns[r.message_id] = {}
        rxns[r.message_id][r.emoji] = (rxns[r.message_id][r.emoji] || 0) + 1
        if (r.user_id === userId) mine[r.message_id] = r.emoji
      })
      setReactions(rxns); setMyReactions(mine)
    }
  }

  useEffect(() => {
    if (room && !seeded && messages.length === 0 && !seededRef.current) { seededRef.current = true; seedRoom() }
  }, [room, seeded, messages.length])

  async function seedRoom() {
    const seeds = SEED_MESSAGES[room.name]; if (!seeds) return
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]; const bot = BOTS[seed.bot]; if (!bot) continue
      const botUserId = BOT_IDS[bot.username]; if (!botUserId) continue
      await new Promise(r => setTimeout(r, 900 * i))
      await supabase.from('messages').insert({ room_id: id, user_id: botUserId, content: seed.text })
    }
  }

  async function handleTyping(e) {
    const val = e.target.value
    if (val.length > MAX_CHARS) return
    setNewMsg(val)
    if (!presenceChannelRef.current || !userId) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      const { data: prof } = await supabase.from('profiles').select('display_name, username').eq('id', userId).single()
      presenceChannelRef.current.track({ user_id: userId, name: prof?.display_name || prof?.username || 'Someone', typing: true })
    }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      presenceChannelRef.current?.track({ user_id: userId, name: '', typing: false })
    }, 2000)
  }

  async function toggleReaction(msgId, emoji, e) {
    e.stopPropagation()
    if (!userId) return
    setReactionPicker(null)
    const existing = myReactions[msgId]
    if (existing === emoji) {
      await supabase.from('reactions').delete().eq('message_id', msgId).eq('user_id', userId)
      setMyReactions(prev => { const n = {...prev}; delete n[msgId]; return n })
      setReactions(prev => {
        const n = JSON.parse(JSON.stringify(prev))
        if (n[msgId]?.[emoji]) { n[msgId][emoji]--; if (n[msgId][emoji] <= 0) delete n[msgId][emoji] }
        return n
      })
    } else {
      if (existing) await supabase.from('reactions').delete().eq('message_id', msgId).eq('user_id', userId)
      const { error } = await supabase.from('reactions').insert({ message_id: msgId, user_id: userId, emoji })
      if (!error) {
        setMyReactions(prev => ({...prev, [msgId]: emoji}))
        setReactions(prev => {
          const n = JSON.parse(JSON.stringify(prev)); if (!n[msgId]) n[msgId] = {}
          if (existing && n[msgId][existing]) { n[msgId][existing]--; if (n[msgId][existing] <= 0) delete n[msgId][existing] }
          n[msgId][emoji] = (n[msgId][emoji] || 0) + 1; return n
        })
      }
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim() || !userId) return
    isTypingRef.current = false; clearTimeout(typingTimeoutRef.current)
    presenceChannelRef.current?.track({ user_id: userId, name: '', typing: false })
    await supabase.from('messages').insert({ room_id: id, user_id: userId, content: newMsg.trim() })
    setNewMsg(''); inputRef.current?.focus()
  }

  function getInitials(name) { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }
  function getAvatarColor(username) {
    const palette = [t.accent, '#7c2d5e', '#9b1d47', '#2060c0', '#1a7a4a', '#8B4513', '#4B0082', '#006666']
    let hash = 0; for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return palette[Math.abs(hash) % palette.length]
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/room/${id}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function groupMessages(msgs) {
    const groups = []
    msgs.forEach((msg, i) => {
      const prev = msgs[i - 1]
      const sameUser = prev && prev.user_id === msg.user_id
      const withinMinute = prev && (new Date(msg.created_at) - new Date(prev.created_at)) < 60000
      if (sameUser && withinMinute) groups[groups.length - 1].msgs.push(msg)
      else groups.push({ user_id: msg.user_id, profile: msg.profiles, msgs: [msg] })
    })
    return groups
  }

  if (!room) return (
    <div style={{ background: t.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text3, fontFamily: "'DM Sans',sans-serif", fontSize: '14px' }}>
      Loading...
    </div>
  )

  const messageGroups = groupMessages(messages)
  const charsLeft = MAX_CHARS - newMsg.length
  const isNearLimit = charsLeft <= 200

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: t.bg, color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
      onClick={() => setReactionPicker(null)}>

      {/* HEADER */}
      <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '10px', background: t.bg }}>
        <button style={{ width: '34px', height: '34px', borderRadius: '10px', background: t.surface, border: `1px solid ${t.border}`, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(room.name)}</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '15px', fontWeight: '700', color: t.text, letterSpacing: '-0.01em' }}>{room.name}</div>
            <div style={{ fontSize: '11px', color: t.text3 }}>{room.is_private ? 'Private room' : 'Public room'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontFamily: "'Space Mono',monospace", color: t.online, background: `${t.online}14`, border: `1px solid ${t.online}30`, padding: '4px 10px', borderRadius: '100px', letterSpacing: '0.06em' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.online }} />LIVE
          </div>
          <button
            style={{ width: '34px', height: '34px', borderRadius: '10px', background: copied ? t.pillBg : t.surface, border: `1px solid ${copied ? t.accent : t.border}`, color: copied ? t.accent : t.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
            onClick={copyInviteLink} title="Copy invite link">
            {copied
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            }
          </button>
        </div>
      </div>

      {/* TOPIC CARD */}
      {room.topic && (
        <div style={{ flexShrink: 0, display: 'flex', margin: '10px 16px', borderRadius: '12px', background: t.pillBg, border: `1px solid ${t.border2}`, overflow: 'hidden' }}>
          <div style={{ width: '3px', flexShrink: 0, background: `linear-gradient(180deg,${t.accent},${t.accent2})` }} />
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: '9px', color: t.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Space Mono',monospace" }}>Today's topic</div>
            <div style={{ fontSize: '13px', color: t.text, lineHeight: 1.5, fontWeight: '500' }}>{room.topic}</div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px', scrollbarWidth: 'none' }}>
        {messages.length === 0 && <div style={{ color: t.text3, textAlign: 'center', marginTop: '40px', fontSize: '13px', fontStyle: 'italic' }}>Starting conversation...</div>}

        {messageGroups.map((group, gi) => {
          const isOwn = group.user_id === userId
          const name = group.profile?.display_name || group.profile?.username || 'Unknown'
          const username = group.profile?.username || ''
          const avatarUrl = group.profile?.avatar_url

          return (
            <div key={gi} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: isOwn ? `linear-gradient(135deg,${t.accent},${t.accent2})` : getAvatarColor(username), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {avatarUrl
                  ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                  : <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{getInitials(name)}</span>
                }
              </div>

              <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', gap: '3px', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: t.text2, cursor: isOwn ? 'default' : 'pointer' }}
                    onClick={() => !isOwn && group.user_id && navigate(`/user/${group.user_id}`)}>
                    {isOwn ? 'You' : name}
                  </span>
                  <span style={{ fontSize: '9px', color: t.text3, fontFamily: "'Space Mono',monospace" }}>{timeAgo(group.msgs[0].created_at)}</span>
                </div>

                {group.msgs.map((msg, mi) => {
                  const msgReactions = reactions[msg.id] || {}
                  const hasReactions = Object.keys(msgReactions).some(k => msgReactions[k] > 0)
                  const isLast = mi === group.msgs.length - 1

                  return (
                    <div key={msg.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          display: 'inline-block', padding: '9px 13px', fontSize: '14px', lineHeight: 1.5, maxWidth: '100%', wordBreak: 'break-word', position: 'relative',
                          background: isOwn ? `linear-gradient(135deg,${t.accent},${t.accent2})` : t.surface,
                          border: isOwn ? 'none' : `1px solid ${t.border}`,
                          color: isOwn ? '#fff' : t.text,
                          borderRadius: '14px',
                          borderBottomRightRadius: isOwn && isLast ? 4 : 14,
                          borderBottomLeftRadius: !isOwn && isLast ? 4 : 14,
                          borderTopLeftRadius: !isOwn && mi === 0 ? 4 : 14,
                          borderTopRightRadius: isOwn && mi === 0 ? 4 : 14,
                          paddingRight: isLast ? '32px' : '13px',
                        }}>{msg.content}</div>
                        {isLast && (
                          <button
                            style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isOwn ? 'left' : 'right']: '6px', width: '20px', height: '20px', borderRadius: '50%', background: `${t.text}14`, border: 'none', color: t.text3, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}
                            onClick={e => { e.stopPropagation(); setReactionPicker(reactionPicker === msg.id ? null : msg.id) }}
                          >+</button>
                        )}
                      </div>

                      {reactionPicker === msg.id && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', [isOwn ? 'right' : 'left']: 0, zIndex: 50, background: t.surface, border: `1px solid ${t.border2}`, borderRadius: '16px', padding: '8px 10px', display: 'flex', gap: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                          {REACTION_EMOJIS.map(emoji => (
                            <button key={emoji}
                              style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: myReactions[msg.id] === emoji ? t.pillBg : 'transparent' }}
                              onClick={e => toggleReaction(msg.id, emoji, e)}
                            >{emoji}</button>
                          ))}
                        </div>
                      )}

                      {hasReactions && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                          {Object.entries(msgReactions).filter(([, c]) => c > 0).map(([emoji, count]) => (
                            <button key={emoji}
                              style={{ display: 'flex', alignItems: 'center', padding: '3px 8px', borderRadius: '100px', border: `1px solid ${myReactions[msg.id] === emoji ? t.border2 : t.border}`, cursor: 'pointer', fontSize: '13px', color: t.text, fontFamily: "'DM Sans',sans-serif", background: myReactions[msg.id] === emoji ? t.pillBg : `${t.text}0a` }}
                              onClick={e => toggleReaction(msg.id, emoji, e)}
                            >{emoji} <span style={{ fontSize: '10px', marginLeft: '2px' }}>{count}</span></button>
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

        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[0, 160, 320].map(delay => (
                <div key={delay} style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.text3, animation: 'typingBounce 1s infinite', animationDelay: `${delay}ms` }} />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: t.text3, fontStyle: 'italic' }}>
              {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <form style={{ flexShrink: 0, padding: '10px 16px 20px', borderTop: `1px solid ${t.border}`, background: t.bg2 }} onSubmit={sendMessage}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            style={{ flex: 1, background: t.surface, border: `1px solid ${isNearLimit ? t.accent + '88' : t.border}`, borderRadius: '12px', padding: '12px 16px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
            placeholder="Say something..."
            value={newMsg}
            onChange={handleTyping}
            autoComplete="off"
          />
          <button style={{ width: '42px', height: '42px', borderRadius: '12px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: newMsg.trim() ? 1 : 0.4, transition: 'opacity 0.15s' }}
            type="submit" disabled={!newMsg.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        {isNearLimit && (
          <div style={{ fontSize: '10px', color: charsLeft <= 0 ? '#ff4444' : t.text3, textAlign: 'right', marginTop: '4px', fontFamily: "'Space Mono',monospace" }}>
            {charsLeft} characters left
          </div>
        )}
      </form>

      <style>{`@keyframes typingBounce { 0%,60%,100% { transform:translateY(0);opacity:0.4; } 30% { transform:translateY(-4px);opacity:1; } }`}</style>
    </div>
  )
}