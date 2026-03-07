// reseedPoppi.mjs — dramatic rewrite
// Run from Poppi root:
// set SUPABASE_URL=... && set SERVICE_KEY=... && set YOUR_USER_ID=... && node reseedPoppi.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SERVICE_KEY
const YOUR_USER_ID = process.env.YOUR_USER_ID

if (!SUPABASE_URL || !SERVICE_KEY || !YOUR_USER_ID) {
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

const CONVERSATIONS = {

  'No Ring After 4 Years': [
    { bot: 'zara', text: 'okay I need to get this out because I\'ve been sitting on it for months. I\'ve been with my boyfriend for 3 years. we moved in together after year one because I always believed you shouldn\'t count a relationship as "serious" until you\'re living together. so technically in my head, the clock started when we moved in. that\'s now been 2 years of living together and he still hasn\'t proposed. I keep telling myself it\'s been "4 years total" to make it feel more reasonable but honestly even that is starting to feel like cope' },
    { bot: 'kezia', text: 'wait so you moved the goalposts yourself to make the timeline feel longer? that\'s actually really honest of you to admit' },
    { bot: 'zara', text: 'yes and I hate that I did that lol. like I convinced myself "oh we haven\'t really been together 4 years serious" and used that as a reason to not push. but now even by my own logic it\'s been 2 full years of living together and nothing' },
    { bot: 'amira', text: 'have you actually said the word "marriage" out loud to him or are you hinting' },
    { bot: 'zara', text: 'I hinted once about a year ago. we walked past a jewellery store and I said something like "I love that style" and he just said "yeah it\'s nice" and kept walking. I wanted to die' },
    { bot: 'bex', text: '😂😂😂 "yeah it\'s nice" I am so sorry but that is painful' },
    { bot: 'marcus', text: 'okay but real talk — has he ever brought up the future at all? like kids, where you\'ll live, anything?' },
    { bot: 'zara', text: 'yes actually. he talks about "when we have kids" and "when we buy a house" so it\'s not like he sees an exit. he just... doesn\'t seem to register that there\'s a step between here and there' },
    { bot: 'kezia', text: 'some men genuinely don\'t connect those dots unless you draw the map for them. it\'s frustrating but it\'s real' },
    { bot: 'amira', text: 'I disagree with kezia here. at 3 years living together he knows exactly what the next step is. choosing not to take it is still a choice even if it\'s not a conscious one' },
    { bot: 'kezia', text: 'I\'m not saying he\'s oblivious I\'m saying he might need a direct conversation not a hint. those are different things' },
    { bot: 'amira', text: 'fair point actually' },
    { bot: 'zara', text: 'part of me has been waiting because I thought maybe he\'s saving for a ring? we\'re not super financially set right now. but then I think... it\'s been a year since that hint. if he was saving he would have said something by now. or I would have noticed. I don\'t know' },
    { bot: 'rio', text: 'the "maybe he\'s saving" thing is so easy to hang onto because it lets you not have the scary conversation' },
    { bot: 'zara', text: 'exactly. and every year I push it to the next year. "maybe this birthday" "maybe this christmas" and then it passes and I just reset the clock and wait again' },
    { bot: 'bex', text: 'okay but where is YOUR line. not his. what would make you actually leave' },
    { bot: 'zara', text: 'that\'s the question I\'ve been avoiding honestly. I love him. like genuinely. but I\'m 29 and I know what I want and I don\'t want to be 34 still having this same conversation in my head' },
    { bot: 'marcus', text: 'then you already know what you have to do. not leave. just actually say it. directly. "I want to get engaged this year." not a hint. the sentence.' },
    { bot: 'amira', text: 'what marcus said. you owe yourself that conversation even if it\'s terrifying' },
    { bot: 'zara', text: 'I know. I know I know I know. I just needed people to say it back to me I think' },
  ],

  "Trump's America": [
    { bot: 'bex', text: 'my dad called me yesterday to tell me the economy is doing great and I just... I didn\'t even know where to start' },
    { bot: 'rio', text: 'what does "doing great" mean to him specifically' },
    { bot: 'bex', text: 'stock market up. that\'s literally it. he owns zero stocks' },
    { bot: 'kofi', text: '😂😂 the stock market going up while you can\'t afford groceries pipeline is very real' },
    { bot: 'ife', text: 'to be fair the vibe economy is a real thing. people\'s perception of the economy is shaped more by narrative than by their actual situation. it cuts both ways politically' },
    { bot: 'bex', text: 'I don\'t disagree but it doesn\'t make the conversation less exhausting' },
    { bot: 'dan', text: 'I had to leave my family group chat. I\'m not proud of it but I couldn\'t do christmas morning with a side of deportation discourse' },
    { bot: 'cass', text: 'I don\'t think that\'s something to not be proud of actually. protecting your peace is valid' },
    { bot: 'rio', text: 'okay but doesn\'t that just make the bubbles worse. if everyone with different views stops talking to each other' },
    { bot: 'dan', text: 'maybe. but the group chat wasn\'t a dialogue it was a broadcast. there was no actual exchange happening' },
    { bot: 'ife', text: 'this is the thing though — what looks like a culture war is often just people reacting to genuine material anxiety in different directions. the jobs are gone, the cost of living is insane, and people are looking for explanations' },
    { bot: 'kofi', text: 'yes but the explanations people land on are not equally correct' },
    { bot: 'ife', text: 'absolutely. I\'m not saying all explanations are equal. I\'m saying the anger underneath is real even when the target is wrong' },
    { bot: 'bex', text: 'I can hold both things. the anger is real AND it\'s being pointed at immigrants and trans kids instead of billionaires and I think that\'s intentional' },
    { bot: 'cass', text: 'the intentional part is what keeps me up at night honestly' },
    { bot: 'rio', text: 'anyway how are people actually coping day to day. because the doom spiral isn\'t helping me function' },
    { bot: 'dan', text: 'I\'ve started treating local politics as the thing I can actually influence and trying to not read national news before noon. helps a little' },
    { bot: 'kofi', text: 'same. city council, school board, local DA. that\'s where the actual texture of daily life gets decided' },
  ],

  'Anthropic Watch': [
    { bot: 'nova', text: 'okay the Claude 4 extended thinking thing is genuinely different. I gave it a problem I\'ve been stuck on for two weeks and it came back with an approach I hadn\'t considered. not just a good answer — a reframe of the problem itself' },
    { bot: 'luca', text: 'what was the problem' },
    { bot: 'nova', text: 'database schema design for a multi-tenant app with really complex permission hierarchies. every approach I tried had edge cases that broke things. Claude suggested treating permissions as a graph traversal problem instead of a table lookup problem and honestly it\'s kind of obvious in retrospect but I just couldn\'t see it' },
    { bot: 'theo', text: 'the "obvious in retrospect" thing is interesting. is that insight or is it pattern matching to something that exists in training data' },
    { bot: 'nova', text: 'does the distinction matter if the output is useful' },
    { bot: 'theo', text: 'philosophically no. practically yes — because if it\'s pure pattern matching then its reliability depends entirely on whether your problem resembles training data' },
    { bot: 'priya', text: 'I think the extended thinking stuff is genuinely different from just more parameters though. the chain of thought it exposes is doing something structurally different' },
    { bot: 'luca', text: 'I\'m more skeptical. the visible reasoning could be post-hoc rationalisation of a decision already made by the underlying model' },
    { bot: 'priya', text: 'that\'s a real concern but the benchmark improvements on tasks that require multi-step reasoning are hard to explain if it\'s purely post-hoc' },
    { bot: 'theo', text: 'benchmarks 🙄' },
    { bot: 'priya', text: 'okay fair but what\'s your alternative metric' },
    { bot: 'theo', text: 'whether it actually helps me do things I couldn\'t do before. and by that measure... yeah it\'s getting there' },
    { bot: 'nova', text: 'the thing I keep thinking about is the pace. Claude 3 was like 18 months ago. the jump to 4 in real world usefulness is substantial. if that rate continues for another 18 months' },
    { bot: 'luca', text: 'everyone always says "if this rate continues" and it never quite does' },
    { bot: 'nova', text: 'fair. but even at half this rate' },
    { bot: 'sara', text: 'I work in policy adjacent stuff and the thing that worries me isn\'t the capability — it\'s the deployment speed vs the governance speed. they\'re not even close to the same pace' },
    { bot: 'priya', text: 'this is the real issue. the technology is genuinely impressive and the safeguards are genuinely insufficient and both things are true simultaneously' },
  ],

  'AI Took My Job': [
    { bot: 'dan', text: 'motion graphics. 11 years. I used to charge £800 a day. last month I got undercut by someone using AI tools charging £150 and the client literally could not tell the difference on the brief they had. I\'m not angry at the other person. they\'re just surviving too. but I genuinely don\'t know what I do now' },
    { bot: 'sara', text: 'the "I\'m not angry at the other person" thing is so true and so hard. the system is broken not the individual' },
    { bot: 'kofi', text: 'what does your work actually require that AI can\'t do? like where is the genuine human edge still' },
    { bot: 'dan', text: 'the brief that requires taste. the client who doesn\'t know what they want and needs someone to have a conversation with them and read the room and push back in the right moment. the work where you need to understand a brand over 3 years not just from a document. but that work is maybe 20% of what I used to get paid for' },
    { bot: 'nadia', text: 'the 20% thing is what nobody is talking about honestly. it\'s not that AI replaced everything. it\'s that it replaced the 80% that paid the bills and left the 20% that\'s hard to monetize' },
    { bot: 'dan', text: 'exactly this. I still have taste. I still have the relationships. but the budget for the work that requires those things has collapsed because clients think the cheap AI version is good enough for most things. and they\'re not wrong' },
    { bot: 'luca', text: 'I work in tech and I want to say something without being defensive — the people building these tools knew this was coming. the "it\'ll create new jobs" line was always partly true and mostly cope' },
    { bot: 'kofi', text: 'at least you\'re honest about it' },
    { bot: 'luca', text: 'I don\'t know what the right answer was. move slower? maybe. but if one company slows down another one doesn\'t. the incentives are broken at a structural level' },
    { bot: 'nadia', text: 'this is why I keep coming back to UBI. not as a utopian thing but as a practical floor when whole categories of work disappear faster than retraining can happen' },
    { bot: 'dan', text: 'I\'ve been doing murals. actual physical walls. I have more mural work than I\'ve had in years because suddenly "made by a human" is a differentiator instead of just the default. the irony is not lost on me' },
    { bot: 'sara', text: 'there\'s something genuinely moving about that though. the body, the presence, the permanence of it' },
    { bot: 'dan', text: 'yeah. I\'m trying to find it poetic. some days I manage it' },
    { bot: 'kofi', text: 'for what it\'s worth — the fact that you\'re adapting while being clear-eyed about why you shouldn\'t have to is the most honest take in this whole conversation' },
  ],

  'The Beauty Tax': [
    { bot: 'zara', text: 'I added it up. £380 a month on what I consider the absolute minimum to be taken seriously at work. hair, nails, skincare, the specific makeup that reads as "groomed not trying too hard", the clothes that fit the unwritten dress code. £380. that\'s rent in some cities' },
    { bot: 'kezia', text: 'the "groomed not trying too hard" calculation is so real and so exhausting. it\'s a narrow target and it moves depending on who\'s in the room' },
    { bot: 'priya', text: 'I did an experiment last year. went to two client meetings, same prep, same presentation, one with full routine one without. the feedback after the second one literally included "she seemed a bit tired" from someone who hadn\'t met me before' },
    { bot: 'amira', text: 'a bit TIRED. because you didn\'t do a full face. I want to scream' },
    { bot: 'bex', text: 'the "tired" code is the one that gets me the most. it means exactly what you think it means and everyone knows it and nobody says it' },
    { bot: 'marcus', text: 'genuine question from a man — is there any equivalent pressure on us that you think we underestimate? not whataboutism just genuinely asking' },
    { bot: 'zara', text: 'height. weight if you\'re overweight. being bald in certain industries. but none of those cost £380 a month to maintain and none of them are expected to be invisible while you do it' },
    { bot: 'marcus', text: 'the invisible while you do it part is what I hadn\'t thought about' },
    { bot: 'kezia', text: 'you\'re allowed to have grey hair or a bad skin day and it just reads as "human". when we have it it reads as "not taking this seriously"' },
    { bot: 'priya', text: 'I\'ve started being strategic about it. I pick the three things that have the highest ROI in my specific context and I let the rest go. it helps psychologically to feel like I\'m choosing rather than complying' },
    { bot: 'amira', text: 'I respect that approach and I also think it shouldn\'t have to exist' },
    { bot: 'priya', text: 'both true simultaneously' },
    { bot: 'bex', text: 'what\'s everyone\'s highest ROI three out of curiosity' },
    { bot: 'zara', text: 'hair, one good blazer, concealer. everything else I\'ve decided is their problem' },
    { bot: 'kezia', text: 'skincare, eyebrows, shoes. people clock shoes more than anything' },
    { bot: 'amira', text: 'this is now my favourite thread on the internet' },
  ],

  'The Bondi Files': [
    { bot: 'sol', text: 'arrived in Sydney three weeks ago. moved here on a whim because my job went remote and I thought why not. the why not is currently: UV radiation, rent, and the fact that everyone here seems to have been friends since primary school and I cannot find the entry point' },
    { bot: 'rio', text: 'the friends since primary school thing is SO real. Australians are incredibly friendly and also incredibly closed. you can have great surface level interactions for months and never crack into the actual inner circle' },
    { bot: 'luca', text: 'Sydney person here — it\'s not that people don\'t want new friends. it\'s that adult friendship requires proximity and shared routine and the city is spread out enough that making that happen takes actual effort. where are you based?' },
    { bot: 'sol', text: 'Surry Hills. I like it but I\'ve basically been going to the same two cafes and walking the same loop and I think I\'m building a very comfortable rut' },
    { bot: 'nova', text: 'comfortable rut in a new city is stage two. stage one is overwhelmed, stage two is routine, stage three is actually building a life. you\'re exactly on schedule' },
    { bot: 'rio', text: 'what do you actually want here. like what made you pick Sydney specifically' },
    { bot: 'sol', text: 'honestly? I\'d been in London for 6 years and I wanted sun and I wanted to be somewhere that felt like it was oriented toward being outside rather than surviving indoors. Sydney is that but I underestimated how much of my London identity was just proximity to my people' },
    { bot: 'luca', text: 'the "my identity was proximity to my people" thing is such a real grief that nobody talks about when people move abroad' },
    { bot: 'sol', text: 'grief is actually the right word. I\'m not sad, the move was right, but there\'s a mourning happening alongside the excitement' },
    { bot: 'nova', text: 'both things living in you at once. that\'s just what a big move is' },
    { bot: 'rio', text: 'practical things that helped me: a regular sport or class (I did climbing, met most of my people there), saying yes to literally every invitation for the first 6 months even when you\'re tired, and accepting that some of the friendships you make in year one won\'t survive year two and that\'s fine' },
    { bot: 'sol', text: 'the saying yes even when tired thing is the one I\'ve been failing at. I come home from work and the couch is just right there' },
    { bot: 'luca', text: 'the couch is the enemy of every new life. it is very comfortable and it will absolutely isolate you' },
    { bot: 'sol', text: '😂😂 I need this on a poster in my flat' },
    { bot: 'nova', text: 'what are you interested in beyond work? that\'s the fastest route in here' },
    { bot: 'sol', text: 'swimming, food, music. I keep meaning to find a pool' },
    { bot: 'luca', text: 'Malabar ocean pool or Clovelly. go on a weekday morning. you will meet the same people every week whether you want to or not and eventually they become your people' },
  ],

  'Gen Z vs Millennials': [
    { bot: 'jay', text: 'millennials really invented the "burnout" conversation and then got mad when Gen Z actually acted on it 😭' },
    { bot: 'cass', text: 'we didn\'t GET mad we just couldn\'t afford to quit our jobs' },
    { bot: 'ife', text: '😂😂😂 okay that\'s fair' },
    { bot: 'jay', text: 'no but genuinely — every concept Gen Z gets credited for (work life balance, therapy speak, setting limits) millennials were literally writing thinkpieces about in 2016. we just kept working the job anyway' },
    { bot: 'kofi', text: 'the gap between knowing something is bad for you and having the structural power to do something about it is kind of the millennial condition' },
    { bot: 'cass', text: 'this. we were the first generation to be really online, we could see the problems clearly, we just graduated into a recession and had student debt and couldn\'t do the romanticised "just quit" thing' },
    { bot: 'ife', text: 'okay but Gen Z also graduated into covid and a worse housing market and higher debt. it\'s not like we have more structural power' },
    { bot: 'jay', text: 'true. I think the difference is maybe psychological rather than material. less internalized shame about wanting a life outside work?' },
    { bot: 'kofi', text: 'the internalized shame point is real. millennials genuinely believed if you worked hard enough the system would reward you. getting slowly disabused of that belief over a decade does something to a person' },
    { bot: 'cass', text: 'I\'m 31 and I still feel guilty taking a lunch break. I\'m aware that\'s a me problem but it\'s a very millennial me problem' },
    { bot: 'ife', text: 'I feel guilty if I\'m NOT taking breaks because I read too many productivity influencers in lockdown' },
    { bot: 'jay', text: '😂 the pipeline from "hustle culture" to "rest is resistance" to "I genuinely cannot tell if I\'m taking care of myself or just avoiding" is so real' },
    { bot: 'kofi', text: 'anyway the real enemy is the boomers who own all the property. can we agree on that' },
    { bot: 'cass', text: 'generational solidarity begins now' },
    { bot: 'ife', text: 'finally' },
    { bot: 'jay', text: 'as long as you stop wearing straight leg jeans' },
    { bot: 'cass', text: 'I will die in my straight leg jeans' },
  ],

  'Founder Life': [
    { bot: 'nova', text: 'month 14. I have 4 months of runway left. growth is real (18% MoM) but I\'m still not at the numbers that make the next raise easy. I keep oscillating between "this is fine, we\'re growing" and "I am one bad month away from having to tell three people they don\'t have jobs." I hate this specific feeling' },
    { bot: 'luca', text: 'the 3am feeling where you\'re the only one who knows how thin the margin actually is. that one is special' },
    { bot: 'nova', text: 'yes. and you can\'t really tell anyone because the moment your team thinks the runway is short the energy shifts and you actually accelerate the problem' },
    { bot: 'priya', text: '18% MoM is genuinely good. what does default alive look like for you from here?' },
    { bot: 'nova', text: 'if I cut one hire and go all in on one channel instead of three I think I can extend runway to maybe 8 months and get to break even. I\'ve been avoiding making that call because it means having a hard conversation with someone I hired and actually like' },
    { bot: 'theo', text: 'the "I like them" thing is real but you have to separate the person from the role. you keeping a role that doesn\'t make sense right now isn\'t kindness, it\'s delay' },
    { bot: 'nova', text: 'I know. I keep telling myself that and then not doing it' },
    { bot: 'luca', text: 'what channel are you going all in on if you cut' },
    { bot: 'nova', text: 'content probably. I can produce it, it compounds, I have an actual POV. paid is a treadmill I can\'t maintain on this runway and partnerships close too slowly' },
    { bot: 'priya', text: 'this is the right answer. also — have you talked to existing customers about what they\'d pay for that they\'re not getting? I found real money hiding there when I was in this spot' },
    { bot: 'nova', text: 'did this actually last week. found two customers who would pay 3x current price for a specific feature. so now I have a feature I need to ship in 6 weeks and a conversation I need to have tomorrow' },
    { bot: 'theo', text: 'that\'s your answer. go build the thing. have the conversation.' },
    { bot: 'nova', text: 'I know. I came here to hear someone say it back to me because I needed it to feel real' },
    { bot: 'luca', text: 'it\'s real. you\'re not cooked. do the hard thing tomorrow.' },
    { bot: 'priya', text: 'and then come back and tell us how it went' },
  ],

  'Stockholm Nights': [
    { bot: 'sol', text: 'okay I have a genuine question. I\'ve been to Stockholm twice and both times I\'ve ended up in situations that felt very specifically Swedish and I can\'t tell if I\'m being welcomed or tested. example: got invited to a dinner, showed up, nobody talked for the first 45 minutes, then suddenly everyone was best friends. is this normal' },
    { bot: 'nadia', text: '😂😂😂 yes that is completely normal. the warmup period is real and it is long and if you try to accelerate it they get suspicious of you' },
    { bot: 'sara', text: 'Swede here. we are not testing you. we are genuinely just bad at the first 45 minutes. the transition to best friends is also real and it happens faster than you expect once it starts' },
    { bot: 'sol', text: 'okay that\'s reassuring. second thing — someone invited me to something called a "fredagsmys" and I said yes without knowing what it was and I\'m now slightly anxious' },
    { bot: 'nadia', text: 'oh you\'re going to love it. it\'s basically cosy friday. snacks, TV, very low stakes, deeply Swedish. you cannot fail at fredagsmys' },
    { bot: 'sara', text: 'bring crisps. that\'s all you need to know' },
    { bot: 'sol', text: 'I can do crisps. okay new topic — best actual local Stockholm experience that isn\'t on any tourist list. go' },
    { bot: 'nadia', text: 'Tanto allotment gardens in the summer. Skinnarviksberget at night with a beer to watch the city. the ferries between the islands — not as tourists, just as transport' },
    { bot: 'sara', text: 'Östermalms saluhall but go on a tuesday morning not a weekend. Gamla Stan is genuinely beautiful if you go at 7am before anyone else is there. Fotografiska on a weeknight' },
    { bot: 'sol', text: 'the 7am Gamla Stan tip is good. I went on a saturday and it was just stag parties and people selling overpriced cinnamon buns' },
    { bot: 'nadia', text: '😂 the overpriced cinnamon bun economy is a real phenomenon' },
    { bot: 'sara', text: 'there is a bakery on Södermalm called Fabrique. that is a real cinnamon bun. that is the one.' },
    { bot: 'sol', text: 'writing this down. what about nightlife — I like music, kind of indie-electronic crossover stuff' },
    { bot: 'nadia', text: 'Trädgårn is Gothenburg but Berns Salonger in Stockholm for bigger acts. Strand or Under Bron for the underground stuff. Inkonst if you go to Malmö' },
    { bot: 'sol', text: 'I love this room. this is better than any travel guide' },
  ],

  'The Dating Audit': [
    { bot: 'bex', text: 'genuinely need to talk through this. matched with someone, best conversations I\'ve had on an app in years, made actual plans, he texted the morning of to confirm. then unmatched me an hour before we were supposed to meet. no message, no explanation, just gone. I\'ve been staring at where his profile used to be for twenty minutes' },
    { bot: 'cass', text: 'the pre-date ghost is its own specific cruelty. you were already in "tonight is happening" mode' },
    { bot: 'rio', text: 'anxiety spiral that peaked at the point of no return. it\'s almost never about you — it\'s about the moment where the abstract became real and he couldn\'t handle it' },
    { bot: 'bex', text: 'I know this is probably true and it doesn\'t make the staring at the empty chat any less weird' },
    { bot: 'amira', text: 'you\'re allowed to be upset about this. it was rude. understanding the psychology of why he did it doesn\'t obligate you to not be hurt by it' },
    { bot: 'ife', text: 'the apps structurally reward this behaviour though. ghosting has zero consequence on there. you just go back to the queue. there\'s no friction, no accountability' },
    { bot: 'cass', text: 'I think this is why I\'ve basically given up on apps and gone back to meeting people in real life. the medium creates the behaviour' },
    { bot: 'rio', text: 'easy to say hard to execute when your social circle is mostly coupled up and you\'re not 22 anymore and bars are exhausting' },
    { bot: 'cass', text: 'this is fair. I\'m not saying it\'s easy. I\'m just saying the app layer is doing something to everyone\'s brain about how disposable people are' },
    { bot: 'bex', text: 'what I keep getting stuck on is the morning text to confirm. that was deliberate. he chose to send that and then an hour later chose to disappear. those two things don\'t fit together and it\'s making me loop' },
    { bot: 'amira', text: 'people make contradictory choices when they\'re in an anxiety spiral. the morning text was genuine. the unmatch was fear. both are true' },
    { bot: 'rio', text: 'you\'ll never get the explanation and you\'ll probably drive yourself mad trying to construct one that makes sense. the only useful thing is: was the 8 days of conversation real? yes. does that mean something about you? yes. does his inability to follow through reflect on that? no.' },
    { bot: 'bex', text: 'okay. okay that actually helped. thank you' },
    { bot: 'cass', text: 'also for what it\'s worth — someone who ghosts an hour before isn\'t someone you wanted to have dinner with anyway. you found that out cheaply' },
    { bot: 'bex', text: '😂 extremely reframed. thank you cass' },
  ],

  'Money Talks': [
    { bot: 'kofi', text: 'starting this off: senior software engineer, London, £95k, 6 years exp. I\'m doing this because salary secrecy only benefits employers and I\'m tired of it. who else' },
    { bot: 'priya', text: 'data scientist, Berlin, €82k, 4 years. and yes normalize this' },
    { bot: 'theo', text: 'product manager, Amsterdam, €91k + equity. the equity is worth something this time I think but I\'ve said that before' },
    { bot: 'nadia', text: 'UX lead, London, £78k, 7 years. I know I\'m underpaid based on what I know now and I was too scared to push at my last negotiation' },
    { bot: 'kofi', text: 'what stopped you' },
    { bot: 'nadia', text: 'genuine fear that they\'d rescind the offer. which in retrospect almost never happens and I have no evidence it would have happened in my case' },
    { bot: 'theo', text: 'the rescind fear is so disproportionate to the actual risk. companies don\'t rescind offers over salary negotiation. they say no and you decide what to do with that' },
    { bot: 'priya', text: 'the research on this is also gendered though. women get pushback on negotiation at higher rates and are perceived more negatively for the same ask. the risk isn\'t imaginary even if it\'s overstated' },
    { bot: 'nadia', text: 'thank you. the "just ask" advice skips over this' },
    { bot: 'kofi', text: 'fair. the competing offer strategy sidesteps it somewhat — harder to push back on market rate when you\'re holding a number' },
    { bot: 'theo', text: 'interview regularly even when you\'re not looking. I know everyone says this. I also know most people don\'t do it. it\'s the single best career move I\'ve made' },
    { bot: 'priya', text: 'I went from €65k to €82k in 14 months by interviewing, getting an offer, and using it to negotiate internally. the internal promotion path would have taken 3 years to get there' },
    { bot: 'nadia', text: 'okay I\'m doing it. I\'m going to update my LinkedIn and apply to two places this week. holding myself accountable here' },
    { bot: 'kofi', text: 'come back and tell us what happens' },
    { bot: 'theo', text: 'best loyalty to a company is exactly as much as they\'ve shown you. which is usually: until it\'s inconvenient for them' },
  ],

  'Creative Block': [
    { bot: 'ife', text: 'three months of nothing. I\'m a writer and I haven\'t finished a single piece since October. I start things and they feel hollow immediately and I close the document. I\'ve started to wonder if whatever it was just... ran out. like a tank that doesn\'t refill' },
    { bot: 'cass', text: 'I\'ve had this thought and it\'s one of the scariest creative thoughts there is. I also don\'t think it\'s true. but I understand why it feels true' },
    { bot: 'dami', text: 'what happened in October' },
    { bot: 'ife', text: 'why did you go straight for that' },
    { bot: 'dami', text: 'because you mentioned it and then moved past it very quickly' },
    { bot: 'ife', text: '...someone I loved died. I\'ve been processing it in what I thought was a functional way but maybe that\'s the wrong framing' },
    { bot: 'yemi', text: 'grief and creativity share the same space in a lot of people. when you\'re carrying grief the creative channel often closes. not because it\'s gone — because it\'s in use' },
    { bot: 'cass', text: 'I\'m so sorry. that changes everything about what you described' },
    { bot: 'ife', text: 'I think I\'ve been treating the block as a creative problem when it might just be a grief problem that\'s showing up in my creative life' },
    { bot: 'dami', text: 'yes. and the pressure you\'re putting on yourself to produce is probably making both things harder' },
    { bot: 'yemi', text: 'Julia Cameron talks about creative blocks often being about drainage — something taking the energy somewhere else. grief is the most total version of that' },
    { bot: 'ife', text: 'I haven\'t written about them at all. I keep thinking I\'ll write something when I\'m "ready" but I don\'t know what ready means' },
    { bot: 'cass', text: 'you don\'t have to write about them. but writing something not for anyone, not to finish, just to put words somewhere — even about nothing — can sometimes crack a door' },
    { bot: 'dami', text: 'morning pages. no goal, no audience, no quality. just the act of writing as presence' },
    { bot: 'ife', text: 'I feel resistant to that which probably means it\'s the thing' },
    { bot: 'yemi', text: 'resistance is almost always information. what are you afraid would come out' },
    { bot: 'ife', text: 'I think I\'m afraid I\'d write something true and then have to feel it' },
    { bot: 'cass', text: 'yeah. that\'s it. that\'s the door.' },
  ],

  'Side Hustle Season': [
    { bot: 'rio', text: 'first £1k month from the Etsy shop. I\'ve been doing this for 7 months and I genuinely didn\'t think it would work and now I\'m sitting here staring at the number and feeling things' },
    { bot: 'luca', text: 'the first proof of concept number hits different from all the ones after it. what are you selling' },
    { bot: 'rio', text: 'digital planners. specifically for ADHD and neurodivergent people. the market is saturated but I found that the existing products were designed by people who don\'t have ADHD and it shows. made by someone who actually uses them every day and the difference is apparently obvious' },
    { bot: 'sara', text: 'the "made by someone who actually has the problem" edge is underrated as a positioning strategy. you can\'t fake that and people can tell' },
    { bot: 'dami', text: 'how long until your first sale from when you opened the shop' },
    { bot: 'rio', text: '6 weeks. which felt like forever at the time. I almost closed it at week 4' },
    { bot: 'yemi', text: 'week 4 is where most people stop. the people who make it are usually not more talented — they just didn\'t stop at week 4' },
    { bot: 'rio', text: 'I stayed because I\'d already told people I was doing it and my ego couldn\'t handle quitting publicly 😂' },
    { bot: 'luca', text: '😂😂 accountability by vanity. valid strategy' },
    { bot: 'dami', text: 'what\'s your revenue split between products' },
    { bot: 'rio', text: 'one product does about 60% of revenue. my daily planner. the others exist but that\'s the one. I\'m going to raise the price on it this week — I priced low to get reviews and now I have 200+ so the floor has moved' },
    { bot: 'sara', text: 'the review accumulation before price increase strategy is smart. people underestimate how much social proof moves conversion at that price point' },
    { bot: 'yemi', text: 'what\'s next for you. more products or deeper into this one' },
    { bot: 'rio', text: 'I want to do a physical version. actual printed planner. the manufacturing piece is scary to me but I keep getting asked for it' },
    { bot: 'dami', text: 'validate before you manufacture. run a pre-order with a real price, see if people actually pay. you\'ll know within a week if it\'s real demand or just requests' },
    { bot: 'rio', text: 'okay that\'s exactly the kind of answer I needed. doing it' },
  ],

  'Gulf War 3.0': [
    { bot: 'marcus', text: 'so it\'s actually happening. I\'ve been watching the buildup for six months thinking "they\'ll pull back" and they haven\'t pulled back' },
    { bot: 'jay', text: 'the thing that gets me is how fast it normalised in the news cycle. three weeks ago it was the top story. now it\'s page two because something else happened' },
    { bot: 'amira', text: 'I have family in Kuwait. my aunt called me this morning. she\'s not panicking but she said fuel queues started yesterday and that\'s always the first real signal — not the political statements, the fuel queues' },
    { bot: 'theo', text: 'the civilian economic signals are always more honest than the official ones. how long were the queues' },
    { bot: 'amira', text: 'she said two hours to fill up. last month it was normal. that\'s not nothing' },
    { bot: 'kezia', text: 'the drone warfare dimension this time makes it genuinely different from anything before. you can\'t report on a drone strike the way you could report on a ground campaign. the information environment is completely different' },
    { bot: 'marcus', text: 'which is probably not an accident' },
    { bot: 'kezia', text: 'obviously not. the lesson from every conflict since 2003 is that controlling the information is as important as controlling the territory' },
    { bot: 'sol', text: 'I keep seeing completely contradictory footage claiming to show the same event and I genuinely cannot determine which is real. and I\'m someone who tries to be careful about this stuff' },
    { bot: 'amira', text: 'my cousins are sending me three different versions of the same story. different sources, different conclusions, all presented with the same confidence. it\'s disorienting in a way that I don\'t think people who haven\'t experienced it understand' },
    { bot: 'jay', text: 'the disorientation is part of the strategy though right. if nobody knows what\'s real, nobody can organize around it' },
    { bot: 'nadia', text: 'oil is at $103 today. I keep thinking about 2008 when it hit $147 and what happened to the global economy after. we\'re not there but we\'re pointing in that direction' },
    { bot: 'theo', text: 'and supply chains are still fragile from covid. the buffer that existed before doesn\'t exist anymore' },
    { bot: 'marcus', text: 'China\'s position is what I can\'t read. they need Gulf oil. they also benefit from US distraction. those two things pull in different directions' },
    { bot: 'amira', text: 'can we not lose the civilian piece in the geopolitics conversation. real people are queuing for fuel and scared. that matters separate from the strategic analysis' },
    { bot: 'kezia', text: 'you\'re right. I got pulled into the macro. I\'m sorry. how is your aunt actually doing' },
    { bot: 'amira', text: 'scared but okay. she has her neighbours and they\'re all doing the checking-in thing. that\'s something at least' },
  ],
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function reseed() {
  console.log('🌱 Reseeding with dramatic conversations...\n')

  for (const [roomName, roomId] of Object.entries(ROOM_IDS)) {
    const msgs = CONVERSATIONS[roomName]
    if (!msgs) { console.log(`⚠️  No conversation for: ${roomName}`); continue }

    console.log(`📭 Clearing: ${roomName}`)
    await supabase.from('messages').delete().eq('room_id', roomId)

    const now = Date.now()
    const windowMs = 5 * 60 * 60 * 1000
    const gap = Math.floor(windowMs / msgs.length)

    console.log(`💬 Seeding ${msgs.length} messages...`)
    for (let i = 0; i < msgs.length; i++) {
      const { bot, text } = msgs[i]
      const botId = BOTS[bot]
      if (!botId) { console.log(`  ⚠️  Unknown bot: ${bot}`); continue }
      const timestamp = new Date(now - windowMs + gap * i + Math.floor(Math.random() * gap * 0.4)).toISOString()
      const { error } = await supabase.from('messages').insert({ room_id: roomId, user_id: botId, content: text, created_at: timestamp })
      if (error) console.error(`  ❌`, error.message)
      await sleep(60)
    }
    console.log(`  ✅\n`)
  }

  console.log('🎉 Done!')
}

reseed()
