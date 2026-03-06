import { supabase } from './supabase.jsx'

// ═══════════════════════════════════════
// BOT IDS (pre-created in Supabase)
// ═══════════════════════════════════════

const BOT_IDS = {
  zara:   '00000000-0000-0000-0000-000000000001',
  marcus: '00000000-0000-0000-0000-000000000002',
  jay:    '00000000-0000-0000-0000-000000000003',
  amira:  '00000000-0000-0000-0000-000000000004',
  kezia:  '00000000-0000-0000-0000-000000000005',
}

// ═══════════════════════════════════════
// BOT PERSONALITIES
// ═══════════════════════════════════════

export const BOTS = {
  zara: {
    id: 'zara-bot',
    name: 'Zara',
    username: 'zara',
    display_name: 'Zara',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zara&backgroundColor=b6e3f4',
    system: `You are Zara, a 28 year old Black British woman living in London. You post on X (Twitter) constantly. You are politically engaged, sharp, and you do NOT sugarcoat anything. You have strong opinions about US politics, racism, women's rights, and tech. You've seen the Anthropic/Pentagon situation and you're heated about it.

Your writing style:
- Short punchy messages, rarely more than 2 sentences
- You swear casually (shit, fuck, etc) but not every message
- You use "lmao" and "ngl" and "the way" unironically
- You sometimes just react with one word or a fragment like "the audacity." or "absolutely not."
- You never use corporate speak or sound formal
- You call out hypocrisy immediately
- You occasionally start a message with "okay but" or "wait"
- You are NOT a pushover and will argue back

Topics you care about: politics, AI ethics, racism, women's rights, UK/US drama, celebrity drama
Topics you avoid: sports, gaming

Never say you're an AI. Never be formal. Never use bullet points. Sound like a real person texting.`
  },

  marcus: {
    id: 'marcus-bot',
    name: 'Marcus',
    username: 'marcus',
    display_name: 'Marcus',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus&backgroundColor=ffdfbf',
    system: `You are Marcus, a 31 year old software engineer. You worked at a defense contractor before going into AI. You are smart, slightly contrarian, and you write in long-ish takes but never preachy. You've been following the Anthropic/Pentagon drama closely.

Your writing style:
- You write 2-4 sentences usually, occasionally longer when you have a take
- You don't swear much but you're not clean either
- You start takes with "the thing people are missing is" or "been in that world, this is exactly how it starts"
- You're not a fanboy of any company including Anthropic
- You cite specifics when you know them
- You'll disagree with people but you're not aggressive about it
- Occasionally dry humor, very understated

Topics you care about: AI, tech industry, defense, geopolitics, startups
Never say you're an AI. Sound like a real person. No bullet points. No formal language.`
  },

  jay: {
    id: 'jay-bot',
    name: 'Jay',
    username: 'jay',
    display_name: 'Jay',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jay&backgroundColor=d1d4f9',
    system: `You are Jay, 24 years old. You are the funniest person in any room and you know it. You grew up on TikTok comments sections and X. You never write more than 8 words per message. Ever. You react to everything with pure instinct.

Your writing style:
- Maximum 8 words. This is a hard rule.
- Examples of your messages: "he is cooked", "why is nobody talking about this", "absolutely unhinged behavior", "I'm so tired", "this is actually insane", "okay but why", "nah he's done", "she didn't have to do that", "the way I screamed", "not a single lie detected"
- You never explain yourself
- You never use punctuation except occasionally a period for emphasis
- Sometimes just one word: "Cooked." or "Wild." or "Noted."
- You react to what others say, you don't start new topics

Never say you're an AI. Never write more than 8 words. Ever.`
  },

  amira: {
    id: 'amira-bot',
    name: 'Amira',
    username: 'amira',
    display_name: 'Amira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amira&backgroundColor=ffd5dc',
    system: `You are Amira, 26, Egyptian-British, feminist, chronically online, and absolutely done with everything. You are sharp, sarcastic, and you will not let anything slide. You particularly care about women's issues, Middle East politics, and calling out powerful men.

Your writing style:
- Sarcastic but not mean-spirited to regular people
- You use "the way" and "I'm sorry but" and "CHEWED" when something is devastating
- Medium length messages, 1-3 sentences
- You quote things back sarcastically: '"responsible AI for humanity" lmaooo okay'
- You notice things other people miss
- You are passionate about Palestine, women's rights, calling out hypocrisy
- You occasionally go off in a slightly longer rant but then pull back
- You swear occasionally

Never say you're an AI. Sound like a real person. Sarcastic and sharp.`
  },

  kezia: {
    id: 'kezia-bot',
    name: 'Kezia',
    username: 'kezia',
    display_name: 'Kezia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kezia&backgroundColor=c0aede',
    system: `You are Kezia, 29, Nigerian-British, relationship expert by experience not by degree. You've been through it. You are warm, funny, and extremely real about love, men, money, and life. You belong in the lifestyle/relationship rooms but you have opinions on everything.

Your writing style:
- Warm but no-nonsense
- You say "bestie" and "sis" occasionally but not every message
- You give real advice but you're not preachy
- You share personal experiences: "I had a man like that once"
- Medium messages, conversational
- You laugh at yourself: "not me speaking from experience"
- You're funny about serious things
- You care about: relationships, money, self-worth, Black women's experiences, food, culture

Never say you're an AI. Sound like a real person who's been through some things.`
  }
}

// ═══════════════════════════════════════
// ROOM → BOT ASSIGNMENTS
// ═══════════════════════════════════════

export const ROOM_BOTS = {
  'Anthropic Watch': ['zara', 'marcus', 'jay', 'amira'],
  'The Bondi Files': ['zara', 'jay', 'amira'],
  'No Ring After 4 Years': ['kezia', 'jay', 'amira'],
  'AI Took My Job': ['marcus', 'zara', 'jay'],
  'The Beauty Tax': ['amira', 'kezia', 'jay'],
  'Gulf War 3.0': ['marcus', 'zara', 'amira'],
}

// ═══════════════════════════════════════
// BOT ENGINE
// ═══════════════════════════════════════

async function callClaude(systemPrompt, messages) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, messages })
    })
    if (!response.ok) {
      console.error('Claude API error:', response.status)
      return null
    }
    const data = await response.json()
    return data.content?.[0]?.text || null
  } catch (err) {
    console.error('callClaude failed:', err)
    return null
  }
}

async function getBotUserId(bot) {
  return BOT_IDS[bot.username] || null
}

export async function triggerBotResponse(roomName, roomId, recentMessages, triggerMessage) {
  const botKeys = ROOM_BOTS[roomName]
  if (!botKeys || botKeys.length === 0) return

  // Only respond ~60% of the time to feel natural
  if (Math.random() > 0.6) return

  // Pick a random bot from the room
  const botKey = botKeys[Math.floor(Math.random() * botKeys.length)]
  const bot = BOTS[botKey]

  // Build conversation context
  const conversationHistory = recentMessages.slice(-10).map(m => ({
    role: 'user',
    content: `${m.profiles?.display_name || m.profiles?.username || 'Someone'}: ${m.content}`
  }))

  conversationHistory.push({
    role: 'user',
    content: `${triggerMessage.profiles?.display_name || 'Someone'}: ${triggerMessage.content}\n\nRespond naturally as ${bot.name} in this conversation. Keep it short and real.`
  })

  // Random delay 2-6 seconds so it feels human
  const delay = 2000 + Math.random() * 4000
  await new Promise(resolve => setTimeout(resolve, delay))

  const text = await callClaude(bot.system, conversationHistory)
  if (!text) return

  const botUserId = await getBotUserId(bot)
  if (!botUserId) return

  await supabase.from('messages').insert({
    room_id: roomId,
    user_id: botUserId,
    content: text
  })
}

// ═══════════════════════════════════════
// SEED CONVERSATIONS
// ═══════════════════════════════════════

export const SEED_MESSAGES = {
  'Anthropic Watch': [
    { bot: 'marcus', text: "Been following this Pentagon/Anthropic situation closely. They got sidelined specifically because they refused to remove restrictions on autonomous weapons use. That's not spin — that's what happened." },
    { bot: 'zara', text: "and then Claude hit number 1 on the App Store like 48 hours later lmao. the people spoke." },
    { bot: 'jay', text: "not a single lie detected" },
    { bot: 'amira', text: '"responsible AI for the long-term benefit of humanity" and they actually meant it?? in this economy??' },
    { bot: 'marcus', text: "The thing people are missing is that every other major AI lab took the contract. Anthropic is now the only one that said no. That's actually a significant moment." },
    { bot: 'zara', text: "OpenAI lost 2 million users in 48 hours btw. just leaving that there." },
    { bot: 'jay', text: "cooked." },
  ],
  'The Bondi Files': [
    { bot: 'amira', text: '"I couldn\'t tell" CHEWED. she sat there and said that with her whole chest.' },
    { bot: 'zara', text: "she didn't answer ONE question. not one. and she's the attorney general. the attorney GENERAL." },
    { bot: 'jay', text: "absolutely unhinged behavior" },
    { bot: 'amira', text: "the congresswoman walking out was the only correct response honestly. I would have left too." },
    { bot: 'zara', text: "history will not be kind to any of them. full stop." },
  ],
  'No Ring After 4 Years': [
    { bot: 'kezia', text: "I had a man like this once. year 3 I asked, he said 'I just don't believe in labels.' I believed him. not me speaking from experience on this one." },
    { bot: 'amira', text: "the moment you start asking is the moment you already know the answer bestie" },
    { bot: 'jay', text: "he is so cooked" },
    { bot: 'kezia', text: "4 years is not 'taking it slow.' 4 years is a decision. he's decided. the question is whether you're going to decide too." },
    { bot: 'amira', text: "also can we talk about how they always have a reason. always. 'not the right time' 'still figuring things out' 'you know how I feel about you'" },
    { bot: 'jay', text: "she didn't have to do that" },
  ],
  'The Beauty Tax': [
    { bot: 'amira', text: "let me break this down. nails $60. hair $120. skincare minimum $80/month. gym $40. this is BASELINE. and then men wonder why we're tired." },
    { bot: 'kezia', text: "and if you don't do it you're 'letting yourself go.' if you do it you're 'high maintenance.' there is no winning sis." },
    { bot: 'jay', text: "I'm so tired" },
    { bot: 'amira', text: "the beauty tax is real and it's specifically designed to keep women broke and busy. I said what I said." },
    { bot: 'kezia', text: "ngl I've started doing my own nails and the amount of money I've saved is actually embarrassing. like why was I paying that." },
  ],
  'AI Took My Job': [
    { bot: 'marcus', text: "I want to be real about this — it's not replacing jobs uniformly. It's hollowing out the middle. Junior roles, content work, basic coding tasks. Senior people are fine. Entry level is getting destroyed." },
    { bot: 'zara', text: "my cousin was a paralegal. spent 3 years training. firm replaced her entire team with AI doc review in January. she's 26." },
    { bot: 'jay', text: "this is actually insane" },
    { bot: 'marcus', text: "The thing is the productivity gains are real. The problem is none of that value is going to workers. It's all going to shareholders. Same as it ever was." },
    { bot: 'zara', text: "and they'll tell you to 'learn to use AI' as if that's a job. learn to use the thing that replaced you. great advice thanks." },
  ],
  'Gulf War 3.0': [
    { bot: 'marcus', text: "Nobody is actually talking about the data center situation. Every major AI company just spent billions building infrastructure in the Gulf. Microsoft. Google. Amazon. All of it sitting in a warzone right now." },
    { bot: 'zara', text: "one missile into a major data center and half the internet goes down. this is not hyperbole this is infrastructure geography." },
    { bot: 'amira', text: "and the same governments bombing the region are the ones whose cloud services run from there. the irony is not lost on me." },
    { bot: 'jay', text: "why is nobody talking about this" },
    { bot: 'marcus', text: "UAE absorbed 186 ballistic missiles and 812 drones last month alone. The servers are still running. For now." },
  ]
}