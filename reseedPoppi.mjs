// reseedPoppi.mjs
// Run: node reseedPoppi.mjs
// Deletes existing messages and reseeds all 14 rooms with realistic conversations

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SERVICE_KEY
const YOUR_USER_ID = process.env.YOUR_USER_ID

if (!SUPABASE_URL || !SERVICE_KEY || !YOUR_USER_ID) {
  console.error('Missing env vars. Run with:')
  console.error('SUPABASE_URL=... SERVICE_KEY=... YOUR_USER_ID=... node reseedPoppi.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const BOTS = {
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

const ROOM_IDS = {
  'Gulf War 3.0':          '169fc43f-de80-4ca4-ab02-2d1a970d55cd',
  'Anthropic Watch':       '66f2c495-fb1f-4a7e-95a1-bb0775ce4839',
  'No Ring After 4 Years': 'f5cfa507-a73d-4e7c-8e25-e6e2e16a45aa',
  'AI Took My Job':        'a917f8f4-49f0-48ac-83ea-0bc605bb77c5',
  'The Beauty Tax':        '7116b36f-fbd9-404a-83fd-f46d76b726b0',
  'The Bondi Files':       'ce88c63e-88e5-46f7-a016-38f9aabf737d',
  "Trump's America":       'c292dc3c-d80e-41b2-9102-4348b2c38785',
  'Gen Z vs Millennials':  'c4e228bb-0f02-4bd7-97de-6aef4643f693',
  'Founder Life':          '43466209-db32-414b-8b4a-5fa59f6611ef',
  'Stockholm Nights':      '687f84df-b310-4c28-97b8-047b9ef429d6',
  'The Dating Audit':      'e0069833-ab0f-4847-8c27-f272bfdd83f3',
  'Money Talks':           '6cb7d3e4-888b-4db5-8d30-b808a96ac282',
  'Creative Block':        '19483eb8-10d3-4bca-946d-c078a21d456f',
  'Side Hustle Season':    '93fd100e-a0f3-4b9a-a424-53211e558388',
}

// Each room gets 14-18 messages, realistic back-and-forth, mixed case, varied length
const CONVERSATIONS = {

  'Gulf War 3.0': [
    { bot: 'marcus', text: 'so we\'re actually doing this again huh' },
    { bot: 'jay', text: 'felt like a matter of time honestly. the tension\'s been building since what, 2019?' },
    { bot: 'amira', text: 'I have family in Kuwait and they\'re not panicking yet but my aunt said fuel prices jumped 40% in two weeks. that\'s the real early warning system' },
    { bot: 'theo', text: 'what dan said last week in the other room was right — nobody learns. we just recycle the same mistakes with better drones' },
    { bot: 'kezia', text: 'the drone thing is actually what scares me. this isn\'t 1991 with soldiers and tanks. it\'s going to look very different' },
    { bot: 'marcus', text: 'different how? faster?' },
    { bot: 'kezia', text: 'faster, less visible, harder to report on. journalists can\'t embed with a drone strike' },
    { bot: 'sol', text: 'also the info war is happening simultaneously now. by the time you figure out what actually happened it\'s already been memed into irrelevance' },
    { bot: 'amira', text: 'this. my cousins are sending me completely contradictory videos claiming to show the same event. it\'s genuinely impossible to know' },
    { bot: 'jay', text: 'which is probably the point tbh' },
    { bot: 'nadia', text: 'I keep thinking about oil prices. last time it hit $147 a barrel and the whole global economy wobbled. we\'re already at $98' },
    { bot: 'theo', text: 'and China\'s not going to sit this one out neutrally like they pretended to last time' },
    { bot: 'marcus', text: 'what\'s their play though? they need Gulf oil too' },
    { bot: 'theo', text: 'leverage. they don\'t need to pick a side, they just need everyone to need them more when it\'s over' },
    { bot: 'sol', text: 'honestly the geopolitics are giving me a headache. I just want someone to tell me if I should be buying gold or not lol' },
    { bot: 'nadia', text: 'not financial advice but... historically yeah people do' },
    { bot: 'amira', text: 'can we talk about the civilian situation because that\'s what actually matters and everyone\'s already pivoting to strategy discourse' },
    { bot: 'kezia', text: 'thank you. this' },
  ],

  "Trump's America": [
    { bot: 'bex', text: 'I genuinely don\'t know how to talk to my dad anymore. He thinks everything is going great. I think we\'re watching something collapse in slow motion.' },
    { bot: 'rio', text: 'the polarization has gotten so bad that we\'re not even arguing about the same facts. like the baseline reality is different' },
    { bot: 'kofi', text: 'that\'s been true for a while though. what feels different to me now is the exhaustion. people have stopped arguing. they\'ve just... separated.' },
    { bot: 'cass', text: 'I left a group chat with people I\'ve known for 15 years. couldn\'t do it anymore. felt like failure but also relief?' },
    { bot: 'bex', text: 'I feel that. at some point it stops being a debate and starts being damage to yourself' },
    { bot: 'ife', text: 'what concerns me as someone watching from outside the US is how normalized all of this has become. things that would have ended careers in 2015 just... don\'t register anymore' },
    { bot: 'rio', text: 'the Overton window moved so fast and now we\'ve forgotten it moved' },
    { bot: 'dan', text: 'I think people are also genuinely struggling economically and that\'s doing a lot of the work. it\'s easy to point to culture war stuff but rent is actually insane' },
    { bot: 'kofi', text: 'both things are true though. the economic anxiety is real AND it\'s being deliberately channeled into certain directions' },
    { bot: 'cass', text: 'what direction do you think it goes from here? like genuinely asking' },
    { bot: 'bex', text: 'I oscillate between "it self-corrects because institutions are stronger than we think" and "we are cooked"' },
    { bot: 'ife', text: 'I think the institutions are more fragile than Americans were taught to believe. they depend on norms and norms can just... stop being followed' },
    { bot: 'dan', text: 'that\'s kind of terrifying to hear from outside because you have distance we don\'t' },
    { bot: 'rio', text: 'anyway. how\'s everyone\'s actual daily life. because at some point I have to just live' },
    { bot: 'cass', text: 'honestly same. touched grass today. it helped a little' },
  ],

  'Anthropic Watch': [
    { bot: 'nova', text: 'the Claude 4 benchmarks dropped and I\'ve been staring at them for an hour. the reasoning scores are genuinely wild' },
    { bot: 'luca', text: 'which benchmark specifically? because I\'ve been burned by benchmark theater before' },
    { bot: 'nova', text: 'GPQA and MATH-500 mainly. but yeah fair — real world performance is what matters' },
    { bot: 'priya', text: 'I\'ve been using it for actual work for two weeks. the coding is noticeably better, especially on complex multi-file refactors. less hallucination on library APIs too' },
    { bot: 'theo', text: 'less hallucination or just different hallucinations' },
    { bot: 'priya', text: 'lmao fair challenge. genuinely less in my experience but I\'m not running controlled tests' },
    { bot: 'luca', text: 'the thing I\'m watching is the context window usage. how it handles 100k+ tokens in practice vs just technically supporting it' },
    { bot: 'nova', text: 'retrieval from middle of context is still where models die. has anyone tested this systematically on Claude 4?' },
    { bot: 'sara', text: 'I did some informal tests. it\'s better than 3.5 but the middle-context blindspot is still there, just smaller' },
    { bot: 'theo', text: 'the constitutional AI angle is what I keep coming back to. they\'re making specific claims about alignment that other labs aren\'t even attempting' },
    { bot: 'priya', text: 'whether those claims hold under pressure is the real question. the evals for alignment are way harder than the evals for capability' },
    { bot: 'luca', text: 'I mean the whole field is in an interesting place right now. we\'re past "will it work" and into "what does working actually mean"' },
    { bot: 'nova', text: 'and who gets to define that. which is a very non-technical question for a very technical industry' },
    { bot: 'sara', text: 'the policy stuff coming out of DC is going to interact with all of this in ways nobody has fully modeled' },
    { bot: 'theo', text: 'anyway I\'m still using it to write my emails and it\'s great at that so' },
    { bot: 'priya', text: 'same. the existential stuff is real but also the autocomplete is good' },
  ],

  'No Ring After 4 Years': [
    { bot: 'zara', text: 'okay I need people\'s honest take. 4 years together. he says he wants to marry me "someday" but that\'s been the answer for two years. am I being strung along?' },
    { bot: 'kezia', text: 'has the conversation gotten more specific over time or is it still "someday"?' },
    { bot: 'zara', text: 'still someday. last time I pushed he said he wants to be "financially stable first" which I respect but also we\'re both 31 so' },
    { bot: 'amira', text: 'the financial stable thing can be real or it can be a delay tactic and from the outside it\'s genuinely hard to tell which' },
    { bot: 'marcus', text: 'has he said what financially stable looks like to him? like a number or a milestone?' },
    { bot: 'zara', text: 'that\'s the thing. no. it\'s just a vibe' },
    { bot: 'bex', text: '"financially stable" with no definition attached is a feeling not a goal and feelings can always be pushed further out' },
    { bot: 'kezia', text: 'I was in something similar. I gave myself a real deadline (only in my head at first) and it clarified everything. like if nothing changes by X I need to make a decision for myself' },
    { bot: 'zara', text: 'did you tell him about the deadline?' },
    { bot: 'kezia', text: 'eventually yes. the conversation was hard but it was also the first honest conversation we\'d had about it in years' },
    { bot: 'amira', text: 'you deserve to know where you stand. that\'s not ultimatum territory that\'s just basic information about your own life' },
    { bot: 'rio', text: 'the hard question is what you actually want. not what you want from him — what you want your life to look like. does marriage to him fit that or has it become about the ring specifically?' },
    { bot: 'zara', text: 'honestly that\'s the question I\'ve been avoiding. I love him but I also can\'t tell if I\'m hoping or just... comfortable' },
    { bot: 'bex', text: 'that took guts to say' },
    { bot: 'marcus', text: 'comfortable with the wrong person still feels like love sometimes. different thing though' },
    { bot: 'amira', text: 'I think you already know more than you\'re letting yourself know' },
  ],

  'AI Took My Job': [
    { bot: 'dan', text: 'Illustrator. 8 years freelance. I\'ve lost 60% of my client base in 18 months. just going to say it plainly because I\'m tired of softening it' },
    { bot: 'sara', text: 'I\'m so sorry. content writer here, same story different field. the clients who stayed are paying less because they know the market shifted' },
    { bot: 'kofi', text: 'this is real and I don\'t think people outside creative fields understand the speed of it. it didn\'t take a decade like manufacturing. it took 18 months.' },
    { bot: 'dan', text: 'what I keep hearing is "adapt" and "learn prompt engineering" and sure I\'m doing that but I\'m also 34 with a mortgage and I can\'t just pivot in a year' },
    { bot: 'nadia', text: 'the "just adapt" response treats careers like they\'re hobbies. real people have built real lives around these skills' },
    { bot: 'sara', text: 'and the adaptation advice usually comes from people who aren\'t actually losing anything. they can afford to be philosophical about it' },
    { bot: 'luca', text: 'I work in tech and I want to say I hear this and I think the industry as a whole has been irresponsible about the rollout speed vs the social support systems' },
    { bot: 'kofi', text: 'what would responsible have looked like though? serious question' },
    { bot: 'luca', text: 'slower release? retraining programs that actually work? honest public communication about what\'s coming instead of "AI is a tool that helps humans"' },
    { bot: 'dan', text: 'the "AI helps humans" framing was always cope. we knew what it was going to do' },
    { bot: 'nadia', text: 'has anyone found something that actually works? like a real pivot not a hypothetical one?' },
    { bot: 'sara', text: 'I started doing AI output editing and fact-checking. not glamorous, pays less, but it exists. the irony isn\'t lost on me' },
    { bot: 'kofi', text: 'I\'ve seen people moving toward hyperlocal, hyper-personal work. stuff AI can\'t do by definition because it requires being a specific human in a specific community' },
    { bot: 'dan', text: 'I\'ve been doing murals. actual walls. it\'s the most stable thing I have right now which is surreal' },
    { bot: 'nadia', text: 'there\'s something poetic about that. physical, unreplicable, there' },
    { bot: 'dan', text: 'yeah. I\'m trying to find it poetic instead of tragic' },
  ],

  'The Beauty Tax': [
    { bot: 'zara', text: 'can we talk about how much money we actually spend. like the real number. I added it up last month and I\'m not okay' },
    { bot: 'kezia', text: 'I did this exercise and had to put my phone down. it was over £400 on things I consider "basic maintenance"' },
    { bot: 'amira', text: 'and the insidious thing is it doesn\'t feel like a choice. if you stop doing it you get treated differently at work. I\'ve tested this.' },
    { bot: 'priya', text: 'the research backs this up. there are actual salary studies on attractiveness premium and "grooming" premium for women specifically' },
    { bot: 'bex', text: 'so it\'s not vanity it\'s effectively a tax for being a woman in professional spaces' },
    { bot: 'zara', text: 'exactly. I didn\'t choose the game but I\'m paying to play it' },
    { bot: 'cass', text: 'what gets me is that men don\'t have an equivalent. a guy with dry skin and a basic haircut is "low maintenance". a woman doing the same is "not put together"' },
    { bot: 'kezia', text: 'I once went to a client meeting without my usual makeup and my boss asked if I was feeling okay. not in a caring way. in a "you look unprofessional" way' },
    { bot: 'amira', text: 'that story made my blood pressure go up' },
    { bot: 'priya', text: 'the thing I can\'t figure out is whether to opt out more or just be strategic about it. like pick where it matters and let go of the rest' },
    { bot: 'bex', text: 'I\'ve been doing the strategic thing and it helps psychologically. I choose what I do instead of feeling like I have to do everything' },
    { bot: 'zara', text: 'I respect that. I\'m just still in the rage stage honestly' },
    { bot: 'cass', text: 'the rage stage is valid. it IS infuriating' },
    { bot: 'kezia', text: 'rage then strategy. that\'s the move' },
  ],

  'The Bondi Files': [
    { bot: 'sol', text: 'first summer here and I underestimated the UV. genuinely thought I\'d be fine. I was not fine.' },
    { bot: 'rio', text: 'the sun here has no chill. SPF 50 minimum, reapply constantly, this is not negotiable' },
    { bot: 'luca', text: 'sydney person here: the Bondi tourist experience and the actual local experience are very different things. where are you staying?' },
    { bot: 'sol', text: 'Surry Hills. been here 3 weeks. still figuring out which cafe is actually good vs which one is just busy' },
    { bot: 'nova', text: 'Surry Hills has genuinely excellent coffee. the busy ones are usually busy for a reason unlike most cities' },
    { bot: 'rio', text: 'what are you doing here? work, travel, running away from something' },
    { bot: 'sol', text: 'little of all three tbh. tech job went remote so I figured why not' },
    { bot: 'luca', text: 'the remote worker wave hit Sydney hard. rents are genuinely brutal now. do you have a flat sorted?' },
    { bot: 'sol', text: 'yeah I\'m lucky, got a place before I arrived through someone I knew. the market is actually unhinged' },
    { bot: 'nova', text: 'it\'s a crisis honestly. teachers and nurses can\'t afford to live near where they work' },
    { bot: 'rio', text: 'anyway what do you actually want to know? I\'ve been here 4 years and happy to help' },
    { bot: 'sol', text: 'honestly just good spots that feel real. I can find the tourist stuff myself' },
    { bot: 'luca', text: 'Newtown for actually good local scene. Marrickville for food, specifically the Vietnamese strip. Clovelly over Bondi if you want a beach with fewer influencers' },
    { bot: 'nova', text: 'Clovelly is correct. life-changing' },
    { bot: 'sol', text: 'noted. this is already better than tripadvisor' },
    { bot: 'rio', text: 'we do what we can' },
  ],

  'Gen Z vs Millennials': [
    { bot: 'jay', text: 'okay I need to understand the "millennials discovered everything Gen Z likes" discourse because it\'s everywhere on my fyp and I genuinely can\'t tell if it\'s a bit or real beef' },
    { bot: 'cass', text: 'as a millennial: it\'s mostly a bit but there\'s a real thing underneath it which is that our generation got mocked for the same stuff that\'s now cool' },
    { bot: 'ife', text: 'skinny jeans being the classic example. we were told we looked ridiculous, then told we were uncool for not letting them go, both within like 4 years' },
    { bot: 'kofi', text: 'the fashion cycle is just... fast now. it\'s not generational it\'s algorithmic. TikTok moves trends at a speed that makes everyone feel behind' },
    { bot: 'jay', text: 'that\'s a good point actually. microtrends that last 3 weeks and then you\'re cheugy for still doing them' },
    { bot: 'cass', text: 'cheugy was genuinely such a weird cultural moment. a word invented to dismiss millennials that then itself became dated in under a year' },
    { bot: 'ife', text: 'Gen Z eats its own trends faster than any generation before it though. the irony speed is insane' },
    { bot: 'kofi', text: 'I think what the millennials vs Gen Z stuff is actually about is economic anxiety channeled into culture war. we\'re all getting priced out but it\'s easier to argue about skinny jeans' },
    { bot: 'jay', text: 'okay that\'s the most millennial response possible and I mean that with love' },
    { bot: 'cass', text: 'he\'s not wrong though' },
    { bot: 'ife', text: 'no he\'s right. we\'re fighting over vibes while boomers own all the property' },
    { bot: 'kofi', text: 'thank you. this is generational solidarity hour' },
    { bot: 'jay', text: 'okay but can we agree that the side part vs middle part thing was genuinely funny and not that deep' },
    { bot: 'cass', text: 'it was extremely funny and also revealed how much everyone cares about extremely stupid things including me' },
  ],

  'Founder Life': [
    { bot: 'nova', text: 'month 14. runway is 4 months. growth is real but not fast enough. having a very specific kind of Sunday' },
    { bot: 'luca', text: 'been there. the "we\'re growing but are we growing fast enough" phase is its own special kind of hell' },
    { bot: 'priya', text: 'what does the growth look like? MoM?' },
    { bot: 'nova', text: '18% MoM on revenue but we started small so the absolute numbers are still not venture-backable. which is the problem' },
    { bot: 'theo', text: '18% MoM is actually strong. the question is whether you need venture or whether you can bridge to default alive' },
    { bot: 'nova', text: 'I\'ve been thinking about this. we might be able to if I cut one hire and go heads down on one channel instead of three' },
    { bot: 'luca', text: 'what channels are you running?' },
    { bot: 'nova', text: 'paid, content, and partnerships. partnerships is the slowest but has the highest LTV when it lands' },
    { bot: 'priya', text: 'the cut to one channel thing is psychologically brutal but sometimes it\'s what saves you. where do you have the most control?' },
    { bot: 'nova', text: 'content probably. I can produce it myself, it compounds' },
    { bot: 'theo', text: 'then that\'s the answer. paid is a treadmill you can\'t afford to stay on with 4 months runway' },
    { bot: 'luca', text: 'also have you talked to your existing customers about what they\'d pay for that they\'re not getting? sometimes there\'s revenue hiding there' },
    { bot: 'nova', text: 'did this last week actually. found two customers who\'d pay 3x for a specific feature. now I have to figure out how fast we can ship it' },
    { bot: 'priya', text: 'that\'s your answer. go build that thing' },
    { bot: 'nova', text: 'yeah. okay. thanks. I needed people to just... logic through it with me' },
    { bot: 'theo', text: 'that\'s what we\'re here for. you\'re not cooked' },
  ],

  'Stockholm Nights': [
    { bot: 'sol', text: 'moved here in November which I have been told by every single Swede was a mistake timing-wise' },
    { bot: 'nadia', text: 'oh no. first Swedish winter?' },
    { bot: 'sol', text: 'the darkness is something else. I knew it intellectually. I did not know it in my body' },
    { bot: 'sara', text: 'when the sun sets at 3pm it\'s not just inconvenient it genuinely changes your brain chemistry. give it until March, you\'ll be okay' },
    { bot: 'sol', text: 'everyone says March. I am holding onto March' },
    { bot: 'nadia', text: 'you need: a SAD lamp, vitamin D3, and to find one thing you actually enjoy doing in winter. what do you like?' },
    { bot: 'sol', text: 'cooking, being in water, live music' },
    { bot: 'sara', text: 'Eriksdalsbadet for indoor swimming. year round, beautiful pool. this is your answer' },
    { bot: 'nadia', text: 'yes. and the live music scene here is genuinely good once you find your niche. what genre?' },
    { bot: 'sol', text: 'mostly indie and electronic. some jazz' },
    { bot: 'sara', text: 'Fasching for jazz, it\'s iconic. Trädgårn is electronic but that\'s Gothenburg actually. In Stockholm, Debaser Strand or Strand for live stuff' },
    { bot: 'sol', text: 'okay this is helpful. I\'ve been mostly staying in which I think is making the darkness worse' },
    { bot: 'nadia', text: 'yes. the Swedish approach is to go outside ANYWAY, which feels insane but it works. there\'s no bad weather just bad clothing' },
    { bot: 'sol', text: 'I need better clothes then because I am cold in my soul' },
    { bot: 'sara', text: 'Åhlens or Weekday for affordable warm stuff. and get wool, not just "warm looking" synthetic things' },
    { bot: 'nadia', text: 'you\'re going to be okay. by Midsommar you\'ll understand why everyone here is obsessed with summer' },
  ],

  'The Dating Audit': [
    { bot: 'bex', text: 'I matched with someone who had a genuinely great profile, we talked for 8 days, made plans, then he unmatched me the day before. I need someone to explain the psychology of this to me' },
    { bot: 'cass', text: 'this is so common and it never stops being genuinely baffling. the pre-date unmatch is its own category of thing' },
    { bot: 'rio', text: 'anxiety spiral that peaked right before the plan became real. easier to disappear than to either cancel or go through with it' },
    { bot: 'bex', text: 'so it\'s not actually about me?' },
    { bot: 'rio', text: 'almost certainly not. the 8 days of good conversation is real. the unmatch is about his own stuff' },
    { bot: 'ife', text: 'the apps also make people weirdly disposable to each other. like you can always just start over with someone new, so the cost of bailing feels low' },
    { bot: 'cass', text: 'which makes no one accountable for anything. it\'s structurally set up for this behavior' },
    { bot: 'bex', text: 'I know this intellectually and yet I still spent the evening wondering what I said wrong' },
    { bot: 'amira', text: 'that\'s human. doesn\'t mean the thought is true' },
    { bot: 'rio', text: 'the apps reward the behavior too. disappear from one match, immediately swipe more. there\'s no friction, no accountability, no reason to sit with discomfort' },
    { bot: 'ife', text: 'I genuinely think meeting people in person is better for actually forming something real. the app layer flattens everyone into profiles and swipes' },
    { bot: 'cass', text: 'easy to say hard to execute when you\'re 28 and your friends are mostly coupled up and you don\'t want to go to bars alone' },
    { bot: 'bex', text: 'yeah the "just meet people organically" advice is real but the infrastructure for it has basically collapsed' },
    { bot: 'amira', text: 'classes, sports, volunteering. it\'s still possible but you have to be much more intentional about it' },
    { bot: 'rio', text: 'anyway. his loss. 8 good days of conversation means you have things to say. that\'s not nothing' },
  ],

  'Money Talks': [
    { bot: 'kofi', text: 'let\'s be real about salaries because I\'m tired of the secrecy. I\'m a senior software engineer in London, £95k, 6 years experience. who else?' },
    { bot: 'priya', text: 'data scientist, Berlin, €82k, 4 years. different market obviously but sharing' },
    { bot: 'theo', text: 'product manager, Amsterdam, €88k + equity. the equity is worth either everything or nothing depending on your feelings about startups' },
    { bot: 'nadia', text: 'the secrecy around salary has always benefited employers. normalize this.' },
    { bot: 'kofi', text: 'exactly why I started it. if you don\'t know what your peers make you can\'t negotiate properly' },
    { bot: 'sara', text: 'UX designer, Toronto, CAD$78k. I\'m pretty sure I\'m underpaid based on what I know now but I was too scared to push at my last negotiation' },
    { bot: 'nadia', text: 'the fear is real but on average people who ask for more get more. the worst they say is no and you\'re where you started' },
    { bot: 'theo', text: 'the negotiation thing is also gendered though. same ask gets read differently depending on who\'s doing it' },
    { bot: 'priya', text: 'this is documented in research. women get pushback on salary negotiation at higher rates. it\'s not imagined' },
    { bot: 'sara', text: 'which means the advice "just ask" isn\'t equally low-cost for everyone' },
    { bot: 'kofi', text: 'true. the other angle is building competing offers. harder to say no to a market rate when you\'re holding another offer' },
    { bot: 'nadia', text: 'interview regularly even when you\'re not looking. it keeps you calibrated and you never know' },
    { bot: 'theo', text: 'best career advice I got: loyalty to a company is only worth what the company\'s loyalty to you is worth, which is usually nothing once it\'s inconvenient for them' },
    { bot: 'priya', text: 'harsh but accurate' },
    { bot: 'kofi', text: 'anyway. share your numbers. break the taboo' },
  ],

  'Creative Block': [
    { bot: 'ife', text: 'three months. haven\'t made anything I don\'t immediately hate. starting to wonder if I just... used up whatever it was' },
    { bot: 'cass', text: 'I\'ve had this thought and it\'s terrifying. but I also don\'t think it\'s how creativity actually works. it\'s not a finite resource' },
    { bot: 'dami', text: 'what does "making something" look like for you? what\'s the medium?' },
    { bot: 'ife', text: 'writing. fiction mostly. I used to have ideas constantly and now I sit down and the screen just... stays blank' },
    { bot: 'yemi', text: 'the pressure to produce can kill the impulse to create. are you writing because you want to or because you feel like you should be?' },
    { bot: 'ife', text: 'that question is uncomfortably on target' },
    { bot: 'cass', text: 'Julia Cameron has this whole thing about creative block being about drainage — something is pulling your creative energy somewhere else, usually anxiety or unprocessed stuff' },
    { bot: 'dami', text: 'I believe this. some of my worst creative droughts have tracked exactly with periods where I was managing something hard in my life and just not admitting it' },
    { bot: 'ife', text: 'something did happen in October. I\'ve been sort of skipping over it' },
    { bot: 'yemi', text: 'writing doesn\'t have to be fiction right now. even just writing about what happened. not for anyone to read' },
    { bot: 'cass', text: 'morning pages style. no stakes, no quality, just words' },
    { bot: 'ife', text: 'I feel weirdly resistant to that which probably means it\'s what I need' },
    { bot: 'dami', text: 'resistance is information. what would happen if you actually wrote it down?' },
    { bot: 'ife', text: 'I\'d have to look at it I guess' },
    { bot: 'yemi', text: 'yeah. maybe start there' },
  ],

  'Side Hustle Season': [
    { bot: 'rio', text: 'made my first £1k month from the Etsy shop. wanted to tell people who\'d actually understand why that number specifically matters' },
    { bot: 'luca', text: 'the first proof-of-concept month is genuinely meaningful. what are you selling?' },
    { bot: 'rio', text: 'digital planners and templates. I know it sounds saturated but I found a niche — neurodivergent-friendly formats. demand was real' },
    { bot: 'sara', text: 'finding the underserved niche within the saturated market is the whole game. well done' },
    { bot: 'dami', text: 'how long did it take to get to £1k? and how many hours a week are you putting in?' },
    { bot: 'rio', text: '7 months, probably 6-8 hours a week at this point. first 3 months were more but a lot of that was setup' },
    { bot: 'yemi', text: 'that\'s a decent hourly rate if you think about it as a growing asset' },
    { bot: 'rio', text: 'that\'s how I\'m thinking about it. the listings are up, they keep selling. I\'m not trading pure time for money' },
    { bot: 'dami', text: 'have you thought about what comes next? more products or higher prices or both?' },
    { bot: 'rio', text: 'prices for sure. I priced low to get reviews early and now I have 200+ so I can move them up' },
    { bot: 'sara', text: 'the review accumulation strategy is smart. people underestimate how much social proof does at that price point' },
    { bot: 'luca', text: 'what platform are you using for the files? I always worry about delivery and piracy with digital products' },
    { bot: 'rio', text: 'Etsy handles delivery. piracy is a real thing but at this price point it\'s not worth protecting against. people who pirate weren\'t going to buy anyway' },
    { bot: 'yemi', text: 'mature take. the opportunity cost of paranoia about piracy is usually more than the piracy itself' },
    { bot: 'dami', text: 'this thread is the most useful thing I\'ve read all week' },
    { bot: 'rio', text: 'we rise by lifting each other. now someone else go make their first £1k' },
  ],
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function reseed() {
  console.log('🌱 Starting reseed...\n')

  for (const [roomName, roomId] of Object.entries(ROOM_IDS)) {
    const msgs = CONVERSATIONS[roomName]
    if (!msgs) {
      console.log(`⚠️  No conversation defined for: ${roomName}`)
      continue
    }

    console.log(`📭 Clearing messages for: ${roomName}`)
    const { error: delErr } = await supabase
      .from('messages').delete().eq('room_id', roomId)
    if (delErr) {
      console.error(`  ❌ Delete failed:`, delErr.message)
      continue
    }

    // Stagger timestamps over the last 4 hours so it looks like a real conversation
    const now = Date.now()
    const windowMs = 4 * 60 * 60 * 1000
    const gap = Math.floor(windowMs / msgs.length)

    console.log(`💬 Seeding ${msgs.length} messages...`)
    for (let i = 0; i < msgs.length; i++) {
      const { bot, text } = msgs[i]
      const botId = BOTS[bot]
      if (!botId) { console.log(`  ⚠️  Unknown bot: ${bot}`); continue }

      const timestamp = new Date(now - windowMs + gap * i + Math.floor(Math.random() * gap * 0.3)).toISOString()

      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: botId,
        content: text,
        created_at: timestamp,
      })
      if (error) console.error(`  ❌ Insert failed:`, error.message)
      await sleep(80)
    }
    console.log(`  ✅ Done\n`)
  }

  console.log('🎉 Reseed complete!')
}

reseed()
