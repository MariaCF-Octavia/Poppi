// uploadRoomCovers.mjs
// Place this in your Poppi root folder, alongside the image files
// Run: node uploadRoomCovers.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars. Run with:')
  console.error('SUPABASE_URL=... SERVICE_KEY=... node uploadRoomCovers.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// filename → { roomName, contentType }
const COVERS = [
  { file: 'IMG_9650.jpeg', room: 'Gulf War 3.0',          type: 'image/jpeg' },
  { file: 'IMG_9652.jpeg', room: "Trump's America",       type: 'image/jpeg' },
  { file: 'IMG_9653.jpeg', room: 'Anthropic Watch',       type: 'image/jpeg' },
  { file: 'IMG_9655.png',  room: 'No Ring After 4 Years', type: 'image/png'  },
  { file: 'IMG_9658.jpeg', room: 'AI Took My Job',        type: 'image/jpeg' },
  { file: 'IMG_9660.jpeg', room: 'The Bondi Files',       type: 'image/jpeg' },
  { file: 'IMG_9661.jpeg', room: 'Gen Z vs Millennials',  type: 'image/jpeg' },
  { file: 'IMG_9663.jpeg', room: 'Founder Life',          type: 'image/jpeg' },
  { file: 'IMG_9664.jpeg', room: 'Stockholm Nights',      type: 'image/jpeg' },
  { file: 'IMG_9666.jpeg', room: 'The Dating Audit',      type: 'image/jpeg' },
  { file: 'IMG_9667.jpeg', room: 'Creative Block',        type: 'image/jpeg' },
]

async function upload() {
  console.log('🖼️  Uploading room cover images...\n')

  for (const { file, room, type } of COVERS) {
    const filePath = join(__dirname, file)
    let buffer
    try {
      buffer = readFileSync(filePath)
    } catch {
      console.log(`⚠️  File not found: ${file} — skipping`)
      continue
    }

    const storagePath = `room-covers/${file}`

    // Upload to storage
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(storagePath, buffer, { contentType: type, upsert: true })

    if (uploadErr) {
      console.error(`❌ Upload failed for ${room}:`, uploadErr.message)
      continue
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(storagePath)

    // Update room row
    const { error: updateErr } = await supabase
      .from('rooms')
      .update({ cover_image: publicUrl })
      .eq('name', room)

    if (updateErr) {
      console.error(`❌ DB update failed for ${room}:`, updateErr.message)
    } else {
      console.log(`✅ ${room}`)
    }
  }

  console.log('\n🎉 Done! Room covers uploaded.')
}

upload()
