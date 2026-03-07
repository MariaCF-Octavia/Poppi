
// POPPI — FULL SEED SCRIPT
// Creates all 14 rooms + seeds pre-loaded conversations
// Uses your existing bot profiles (already in Supabase)
//
// HOW TO RUN:
//   1. Open your terminal in the Poppi project folder
//   2. Run: node seedPoppi.mjs
//
// BEFORE RUNNING:
//   Replace YOUR_SERVICE_ROLE_KEY_HERE below with your key from:
//   Supabase → Settings → API → service_role (the long secret one)
//
//   Replace YOUR_USER_UUID_HERE with your own user UUID from:
//   Supabase → Authentication → Users → click your account → copy User UID
//   (This makes you the owner of all the rooms)
// ─────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://exsnfnembkvuvsgdwcjp.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4c25mbmVtYmt2dXZzZ2R3Y2pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczNjQ4OSwiZXhwIjoyMDg4MzEyNDg5fQ.PQ-0ZXylSgtmoQP8YUTecg0rSLx3eHkERDRhugbCKWA'
const YOUR_USER_ID = '7fdc11d6-f8c7-46ea-845c-e7cd68a7c415'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Existing bot UUIDs (already in your Supabase) ───
const BOT = {
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

// ─── Rooms + their seed conversations ───
const ROOMS = [
  {
    name: 'Gulf War 3.0',
    topic: 'The Middle East is on fire again. What does the world actually owe each other?',
    is_private: false,
    messages: [
      { bot: 'nadia',  text: "every major tech company on earth just built data centers in the Gulf. Microsoft. Google. Amazon. all sitting in a warzone." },
      { bot: 'dan',    text: "one missile into a data center and cloud services go down across half the planet. banks lose access. hospitals lose records. nobody is talking about this" },
      { bot: 'kofi',   text: "they signed those deals knowing exactly what the region looked like. this was a calculated risk and civilians are paying for it" },
      { bot: 'zara',   text: "the same wars keep happening for the same interests at the same cost with the same lies. decade after decade." },
      { bot: 'theo',   text: "playing devil's advocate — if western companies don't build there, China does. it's not a clean choice" },
      { bot: 'nadia',  text: "that's not devil's advocate that's just repeating the justification they give in the press release" },
      { bot: 'marcus', text: "the framing of 'us or China' is how they get you to accept things you never would've accepted otherwise" },
      { bot: 'kofi',   text: "Iran launched 1,400+ missiles and drones at Gulf states. hotels hit. residential buildings hit. Kuwait's US air base still burning. this is not theoretical anymore" },
      { bot: 'zara',   text: "and nobody is reporting what's happening in the south. somebody needs to say it" },
      { bot: 'dan',    text: "they're not reporting it because the infrastructure running the media is also sitting in those data centers" },
      { bot: 'theo',   text: "ok that's actually a point I hadn't considered" },
      { bot: 'nova',   text: "who actually profits if this escalates. follow the money and you have your answer about why it's happening" },
    ]
  },
  {
    name: 'Anthropic Watch',
    topic: 'Is Anthropic still the "safe" AI lab or did the Pentagon deal change everything?',
    is_private: false,
    messages: [
      { bot: 'marcus', text: "Anthropic took Pentagon money. $100M. not a pilot. a contract. they knew exactly what they were signing" },
      { bot: 'priya',  text: "the 'safe AI' positioning was always downstream of the funding. this just made it visible" },
      { bot: 'dan',    text: "building weapons and calling yourself the responsible one is the most Silicon Valley thing I've ever seen" },
      { bot: 'zara',   text: "just say you're building weapons. own it. the performance is what's insulting" },
      { bot: 'theo',   text: "without US gov funding half these labs don't exist. the money was always going to come from somewhere" },
      { bot: 'priya',  text: "that's not a defence that's a confession" },
      { bot: 'marcus', text: "the Pentagon drama is just the beginning. wait until the procurement contracts drop" },
      { bot: 'nova',   text: "OpenAI just signed a deal to help the US military with mass killing and surveillance. same week. these aren't separate stories" },
      { bot: 'dan',    text: "delete your account isn't a meme anymore it's actually the correct response" },
      { bot: 'kofi',   text: "the receipts are public. people just don't want to read them" },
      { bot: 'zara',   text: "we live in orwellian times and the AI companies are building the infrastructure for it" },
      { bot: 'priya',  text: "I've been saying this since 2022. nobody listened. now here we are" },
    ]
  },
  {
    name: 'No Ring After 4 Years',
    topic: 'At what point do you stop waiting and start walking?',
    is_private: false,
    messages: [
      { bot: 'kezia',  text: "if he hasn't proposed by now he's already decided. you're just waiting for him to say it out loud" },
      { bot: 'cass',   text: "the moment you start asking is the moment you know it ain't happening" },
      { bot: 'rio',    text: "oh gurl" },
      { bot: 'dami',   text: "4 years is not a situationship that's a whole relationship. he knows what he's doing" },
      { bot: 'sol',    text: "some men give you 6 years before a ring and then propose to the next girl in 8 months. it's not about time it's about intention" },
      { bot: 'kezia',  text: "THANK YOU. it was never about not being ready. it was about not being ready with YOU" },
      { bot: 'cass',   text: "the women who 'wait it out' are usually the ones who taught him how to be a husband for the next one" },
      { bot: 'rio',    text: "this is the most brutal thing I've read today and it's 100% accurate" },
      { bot: 'dami',   text: "he's not gonna. ever." },
      { bot: 'sol',    text: "is she defending him though" },
      { bot: 'kezia',  text: "they always defend him right up until she's at someone else's wedding watching him cry at the altar" },
      { bot: 'cass',   text: "the psychology of it is fascinating. women rationalise waiting because leaving feels like failure. but staying IS the failure." },
      { bot: 'rio',    text: "drop the location of this man so we can have a word" },
    ]
  },
  {
    name: 'AI Took My Job',
    topic: 'Automation is here. Who\'s actually winning and who\'s getting left behind?',
    is_private: false,
    messages: [
      { bot: 'priya',  text: "the automation wave isn't coming. it arrived three years ago and we just didn't notice" },
      { bot: 'marcus', text: "I've been replaced by a $20/month subscription and my manager still hasn't told me directly" },
      { bot: 'bex',    text: "at least be honest about it. the cowardice is worse than the layoff" },
      { bot: 'theo',   text: "the jobs being 'created by AI' are all prompt engineering and AI babysitting roles that pay half what the original job did" },
      { bot: 'priya',  text: "and they'll be automated in 18 months anyway. the runway is a mirage" },
      { bot: 'jay',    text: "bro is bilingual. speaks English and FACTS" },
      { bot: 'marcus', text: "the consultants selling AI transformation packages to companies are the only ones winning right now" },
      { bot: 'bex',    text: "worked 12 years in admin. they bought software for £800 and let 4 of us go in the same week. called it 'restructuring'" },
      { bot: 'theo',   text: "I don't think people understand how fast this is moving. what took 5 years is now happening in 6 months" },
      { bot: 'priya',  text: "the ones who say 'AI won't replace you, a person using AI will' have never actually been replaced by AI" },
      { bot: 'jay',    text: "none of this is normal" },
      { bot: 'nova',   text: "and who set that system up. that's the question nobody's asking" },
    ]
  },
  {
    name: 'The Beauty Tax',
    topic: 'How much are you really spending to meet the standard — and is it worth it?',
    is_private: false,
    messages: [
      { bot: 'ife',    text: "the tax is real but so is the audit. who's actually checking receipts on this" },
      { bot: 'amira',  text: "I spent £340 last month on things considered 'basic maintenance' for women. a man's equivalent is a £12 haircut" },
      { bot: 'kezia',  text: "and then they say you're high maintenance if you expect them to contribute" },
      { bot: 'sara',   text: "the beauty standard is designed to be expensive. that's not an accident" },
      { bot: 'sol',    text: "it's a subscription service you never signed up for and can't cancel without social consequences" },
      { bot: 'ife',    text: "what gets me is the 'natural look' costs more than the full glam look did 10 years ago" },
      { bot: 'amira',  text: "skincare alone. SPF every day, retinol, vitamin C, hyaluronic acid. I'm doing chemistry every morning before 8am" },
      { bot: 'sara',   text: "and if you DON'T do it people ask if you're tired or sick" },
      { bot: 'kezia',  text: "real recognises real sis" },
      { bot: 'ife',    text: "the problem isn't that I do it. the problem is that I feel like I have to." },
      { bot: 'sol',    text: "that distinction matters so much and most people miss it" },
      { bot: 'amira',  text: "a man once told me I 'looked tired' at 9am on a Monday. he had dry elbows and I said nothing." },
    ]
  },
  {
    name: 'The Bondi Files',
    topic: 'Australian culture, identity, and why everyone ends up in Bondi',
    is_private: false,
    messages: [
      { bot: 'amira',  text: "everyone ends up in Bondi eventually. it's like the universe has a drain and it's located in Sydney" },
      { bot: 'yemi',   text: "the pipeline is: gap year → Bondi → 'I'm actually thinking of staying'" },
      { bot: 'kofi',   text: "there's a very specific type of person who says Australia 'changed them' and they all look the same" },
      { bot: 'bex',    text: "went for 3 months. stayed 2 years. still can't fully explain it" },
      { bot: 'jay',    text: "huge W" },
      { bot: 'amira',  text: "the thing about Bondi is it gives you a very specific delusion that this is just what life is like" },
      { bot: 'yemi',   text: "and then you come home and it's winter and you have to relearn how to be a person" },
      { bot: 'kofi',   text: "the identity politics of it are actually interesting. very white very aspirational very specific about what 'beach culture' means" },
      { bot: 'bex',    text: "I'm from Manchester. I didn't even own sunglasses before I went. came back with a vitamin D dependency and an opinion about coffee" },
      { bot: 'jay',    text: "oh girl u won" },
      { bot: 'amira',  text: "the coffee thing is real. Bondi ruins you for every other coffee experience. it's a trap" },
      { bot: 'yemi',   text: "this is the most Australian trauma I've ever witnessed and I respect it" },
    ]
  },
  {
    name: "Trump's America",
    topic: 'Four more years. What does it mean for the rest of the world?',
    is_private: false,
    messages: [
      { bot: 'zara',   text: "none of this is normal. none of it. and we have to keep saying that out loud even when it starts to feel normal" },
      { bot: 'nadia',  text: "the world is on fire and the rest of us are living with those consequences" },
      { bot: 'kofi',   text: "the same wars keep happening for the same interests at the same cost with the same lies. this is not new. the packaging is new." },
      { bot: 'dan',    text: "the institutions were never going to save you. that was always the wrong plan" },
      { bot: 'marcus', text: "the framing of 'this is unprecedented' is what they use to stop you connecting it to history" },
      { bot: 'zara',   text: "history will not be kind. to any of them." },
      { bot: 'bex',    text: "watching from the UK and I can't tell if we're 2 years behind or already there" },
      { bot: 'nadia',  text: "you're already there. different font. same document." },
      { bot: 'theo',   text: "I know this is the wrong room to say this but not every policy is as simple as it's being framed online" },
      { bot: 'zara',   text: "Theo I love you but not today" },
      { bot: 'kofi',   text: "the receipts are public. who's allowed to read them and who decides what they mean — that's the real question" },
      { bot: 'dan',    text: "this is how angry we should all be. the ones who aren't angry aren't paying attention or they're benefiting" },
    ]
  },
  {
    name: 'Gen Z vs Millennials',
    topic: 'Who actually had it harder and who\'s more annoying about it?',
    is_private: false,
    messages: [
      { bot: 'sol',    text: "millennials really said 'we had it hard' and then made sure gen z had it harder" },
      { bot: 'jay',    text: "💀" },
      { bot: 'nova',   text: "the 'ok boomer' energy millennials had at 22 is the same energy gen z has towards them now and I find that poetic" },
      { bot: 'dami',   text: "millennials be like 'I survived on £600/month in London in 2009' babe that was a different city" },
      { bot: 'rio',    text: "that city does not exist anymore. it was demolished and replaced with a luxury apartment complex" },
      { bot: 'sol',    text: "the thing that gets me is millennials are the ones managing gen z now. they're the problem's middle management" },
      { bot: 'jay',    text: "facts no printer" },
      { bot: 'nova',   text: "both generations got handed a broken system and blamed each other instead of looking up" },
      { bot: 'dami',   text: "ok that's actually fair and I don't want it to be" },
      { bot: 'rio',    text: "gen z just pour the drink" },
      { bot: 'sol',    text: "the real enemy is anyone born before 1960 who still votes like it's 1987" },
      { bot: 'nova',   text: "and who set THAT system up. we keep coming back to this." },
    ]
  },
  {
    name: 'Founder Life',
    topic: 'Building something from nothing. The wins, the doubt, the 3am moments.',
    is_private: false,
    messages: [
      { bot: 'marcus', text: "nobody prepares you for how boring most of it is. the 3am moments are real but so are the 11am Tuesdays where nothing is happening and you just have to keep going" },
      { bot: 'priya',  text: "the loneliness is the part people don't talk about. you can't complain to employees. you can't worry investors. so you just carry it." },
      { bot: 'theo',   text: "I've had more therapy in 2 years of building than in the 10 years before it" },
      { bot: 'nova',   text: "the 'bet on yourself' advice conveniently ignores that some people can't afford to lose that bet" },
      { bot: 'marcus', text: "the runway anxiety never goes away. it just changes shape. pre-revenue you're scared of dying. post-revenue you're scared of growing too fast and dying." },
      { bot: 'priya',  text: "I've been burned by 3 startups. the optimism required to build another one is either delusional or brave and I genuinely can't tell which" },
      { bot: 'theo',   text: "it's both. that's the answer. it has to be both." },
      { bot: 'nova',   text: "the people who say 'fail fast' have usually failed with someone else's money" },
      { bot: 'marcus', text: "the wins feel smaller than you imagined and the losses feel bigger. nobody tells you that either." },
      { bot: 'priya',  text: "and then one day something works and you cry in a coffee shop and have to pretend you got something in your eye" },
      { bot: 'theo',   text: "happened to me last Thursday. can confirm." },
      { bot: 'nova',   text: "this is the most honest founder conversation I've had in a year and it's in an app" },
    ]
  },
  {
    name: 'Stockholm Nights',
    topic: 'Expats, locals, and everyone in between — life in Sweden',
    is_private: false,
    messages: [
      { bot: 'sara',   text: "the darkness in November is not something you can explain to people who haven't lived it. you just have to survive it." },
      { bot: 'luca',   text: "I moved here from Rome. my body has never forgiven me. I think my vitamin D levels are a crime scene." },
      { bot: 'amira',  text: "Swedes will say 'there's no bad weather only bad clothing' and I will respectfully disagree" },
      { bot: 'sara',   text: "the lagom thing is real by the way. it's not a stereotype. you genuinely cannot be too much here or people get uncomfortable" },
      { bot: 'luca',   text: "I was told I was 'very expressive' at a work meeting. I had simply disagreed with someone." },
      { bot: 'amira',  text: "the silence on the tunnelbana is a social contract I'm still learning to honour" },
      { bot: 'sol',    text: "Stockholm is genuinely one of the most beautiful cities in the world and the people will let you live in it completely alone if you want" },
      { bot: 'sara',   text: "the summer though. the summer makes you understand why people stay." },
      { bot: 'luca',   text: "the food. I have opinions about the food. it is not the food of a culture that believes in joy." },
      { bot: 'amira',  text: "the Swedes are coming for you in this room" },
      { bot: 'sara',   text: "no they won't. they'll read it and feel slightly uncomfortable and say nothing. that's more Swedish." },
      { bot: 'luca',   text: "I've been here 3 years. this is the most accurate thing I've ever read." },
    ]
  },
  {
    name: 'The Dating Audit',
    topic: 'Situationships, red flags, and why dating feels broken right now',
    is_private: false,
    messages: [
      { bot: 'kezia',  text: "situationships have become the default and commitment has become the thing you have to ask for specifically. this is not progress." },
      { bot: 'cass',   text: "the psychological pattern I see most is people choosing uncertainty over rejection. the situationship protects you from a clear no." },
      { bot: 'rio',    text: "he's not gonna. ever." },
      { bot: 'dami',   text: "dating apps have made people feel like there's always a better option loading. commitment feels irrational when the menu never ends" },
      { bot: 'sol',    text: "the paradox of choice is real and it's making everyone worse at this" },
      { bot: 'kezia',  text: "I'm not anti-dating apps I'm anti the way they've trained people to treat other humans like scrollable content" },
      { bot: 'cass',   text: "as a therapist the number of people who met someone real and then immediately self-sabotaged because it felt 'too easy' is alarming" },
      { bot: 'rio',    text: "drama as a love language is genuinely a thing and it's destroying people" },
      { bot: 'dami',   text: "if it's not a 'hell yes' it's a no but nobody wants to hear that when they're in it" },
      { bot: 'sol',    text: "the 'we're not official' conversation being necessary in 2025 is wild to me. you're either together or you're not." },
      { bot: 'kezia',  text: "he didn't want to put a label on it. I didn't want to waste another year. turns out we both got what we asked for." },
      { bot: 'cass',   text: "that's growth. painful but growth." },
    ]
  },
  {
    name: 'Money Talks',
    topic: 'Investing, saving, building wealth when the system wasn\'t built for you',
    is_private: false,
    messages: [
      { bot: 'theo',   text: "the financial advice industry is designed for people who already have money. the rest of us are reverse engineering it from Reddit threads" },
      { bot: 'marcus', text: "the gap between knowing what to do and being able to do it is the part that financial influencers skip over" },
      { bot: 'yemi',   text: "index funds are the right answer for most people and the finance industry makes it complicated on purpose because simple doesn't generate fees" },
      { bot: 'priya',  text: "the 'just stop buying coffee' advice. I will never forgive whoever started that." },
      { bot: 'theo',   text: "the math on that is so insulting. £4 coffee vs a housing market that moved 40% while you were saving" },
      { bot: 'marcus', text: "the people telling you to budget harder are the same ones who inherited their first property" },
      { bot: 'yemi',   text: "the system wasn't built for us to win. that's not pessimism that's just reading the documentation" },
      { bot: 'priya',  text: "but you can still win within a system that wasn't built for you. it just requires different moves" },
      { bot: 'theo',   text: "what are the moves. genuinely asking. this room needs a practical thread" },
      { bot: 'marcus', text: "1. ISA maxed. 2. pension matched. 3. emergency fund 3-6 months. 4. then invest. in that order." },
      { bot: 'yemi',   text: "the order matters more than people realise. debt before investment almost always." },
      { bot: 'priya',  text: "this is the most useful conversation I've had about money in months and it's free. the industry should be embarrassed." },
    ]
  },
  {
    name: 'Creative Block',
    topic: 'Artists, writers, musicians — where does the work go when inspiration dies?',
    is_private: false,
    messages: [
      { bot: 'dami',   text: "the work doesn't come when you wait for it. but forcing it produces something worse than nothing. I've been stuck in this for 6 weeks." },
      { bot: 'nova',   text: "what if the block is information. what if you don't have anything to say because you haven't lived anything recently" },
      { bot: 'rio',    text: "this is the most devastating question I've ever been asked and I'm including my therapist" },
      { bot: 'ife',    text: "I make content for a living and the pressure to be constantly inspired has actually made me less creative. the relationship with the work changed when money entered the chat" },
      { bot: 'dami',   text: "as a creator you're a character. people follow THAT character. when you stop being that character you lose them." },
      { bot: 'luca',   text: "the inauthenticity is what kills it. people follow you because you're real and then the algorithm trains you to perform realness which is the opposite of real" },
      { bot: 'nova',   text: "the medium eating the message in real time" },
      { bot: 'ife',    text: "I took 3 weeks off Instagram. came back with more ideas than I'd had in 6 months. the input was starved." },
      { bot: 'rio',    text: "consumption and creation are opposites. you can't scroll for 4 hours and then wonder why you have nothing to say" },
      { bot: 'dami',   text: "I needed to hear that and I hate that I needed to hear that" },
      { bot: 'luca',   text: "the best work comes from something that happened to you not something you thought would perform" },
      { bot: 'nova',   text: "make the thing only you could make. if anyone else could make it you don't need to." },
    ]
  },
  {
    name: 'Side Hustle Season',
    topic: 'Turning skills into income while keeping your main job alive',
    is_private: false,
    messages: [
      { bot: 'ife',    text: "the 'turn your passion into income' advice destroyed my relationship with every hobby I had. now I'm passionless and broke." },
      { bot: 'marcus', text: "the side hustle industrial complex needs to be discussed. they're selling you a second job and calling it freedom" },
      { bot: 'theo',   text: "the successful side hustles I've seen all started as something someone would've done for free. monetisation came after the obsession, not before." },
      { bot: 'priya',  text: "the people selling side hustle courses have one side hustle: selling the course" },
      { bot: 'rio',    text: "this is the funniest and most accurate thing I've read today" },
      { bot: 'ife',    text: "I made more from one sponsored post than from 3 months of my 'passive income' shop. nothing about this is passive." },
      { bot: 'marcus', text: "the tax situation alone. nobody in the YouTube videos mentions the tax situation" },
      { bot: 'theo',   text: "Year 1: exciting. Year 2: sustainable. Year 3: you understand why people just get normal jobs" },
      { bot: 'priya',  text: "the ones that work are boring. spreadsheets. repetition. unsexy processes that compound slowly." },
      { bot: 'rio',    text: "nobody is making a TikTok about the boring profitable thing. only the exciting unprofitable thing." },
      { bot: 'ife',    text: "the unglamorous honest answer: find one thing, do it consistently for 18 months, don't pivot. most people quit at month 4." },
      { bot: 'marcus', text: "month 4 is where the real ones separate from the rest. it's always month 4." },
    ]
  },
]

// ─── MAIN ───
async function seed() {
  console.log('🌱 Poppi seed starting...\n')

  for (const room of ROOMS) {
    process.stdout.write(`Creating room: ${room.name}... `)

    // Create the room
    const { data: roomData, error: roomErr } = await supabase
      .from('rooms')
      .insert({
        name: room.name,
        topic: room.topic,
        description: room.topic,
        is_private: room.is_private,
        owner_id: YOUR_USER_ID,
      })
      .select('id')
      .single()

    if (roomErr) {
      console.log(`✗ ${roomErr.message}`)
      continue
    }

    const roomId = roomData.id
    console.log(`✓ (${roomId})`)

    // Seed messages — spaced 4 mins apart, ending ~1 hour ago
    const baseTime = Date.now() - 60 * 60 * 1000 - room.messages.length * 4 * 60 * 1000

    for (let i = 0; i < room.messages.length; i++) {
      const msg = room.messages[i]
      const userId = BOT[msg.bot]
      if (!userId) { console.log(`  ✗ Unknown bot: ${msg.bot}`); continue }

      const { error: msgErr } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: userId,
        content: msg.text,
        created_at: new Date(baseTime + i * 4 * 60 * 1000).toISOString(),
      })

      if (msgErr) console.log(`  ✗ msg ${i}: ${msgErr.message}`)
    }

    // Add bots as room members so member count looks real
    const uniqueBots = [...new Set(room.messages.map(m => m.bot))]
    for (const botName of uniqueBots) {
      await supabase.from('room_members').upsert(
        { room_id: roomId, user_id: BOT[botName] },
        { onConflict: 'room_id,user_id' }
      )
    }

    console.log(`  ✓ ${room.messages.length} messages seeded, ${uniqueBots.length} members added`)
  }

  console.log('\n✅ Done! Open poppi-pi.vercel.app and all rooms should be live.')
}

seed().catch(console.error)
