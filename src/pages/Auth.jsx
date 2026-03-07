import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase.jsx'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const fileInputRef = useRef(null)

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      setError('Image must be under 3MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function uploadAvatar(userId) {
    if (!avatarFile) return null
    const ext = avatarFile.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true })
    if (error) {
      console.error('Avatar upload error:', error)
      return null
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      // Check username availability
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existing) {
        setError('Username already taken')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Upload avatar if provided
        const avatarUrl = await uploadAvatar(data.user.id)

        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: username,
          display_name: displayName || username,
          ...(avatarUrl && { avatar_url: avatarUrl })
        })

        setIsLogin(true)
        setError('')
        // Small confirmation — no alert, just switch to login
      }
    }
    setLoading(false)
  }

  function getInitial() {
    return (displayName || username || '?').charAt(0).toUpperCase()
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logo}>poppi</div>
          <div style={s.tagline}>The place you build your people.</div>
        </div>

        {/* Tab toggle */}
        <div style={s.tabs}>
          <button
            style={{...s.tab, ...(isLogin ? s.tabActive : {})}}
            onClick={() => { setIsLogin(true); setError('') }}
            type="button"
          >
            Sign in
          </button>
          <button
            style={{...s.tab, ...(!isLogin ? s.tabActive : {})}}
            onClick={() => { setIsLogin(false); setError('') }}
            type="button"
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>

          {/* Signup-only fields */}
          {!isLogin && (
            <>
              {/* Avatar picker */}
              <div style={s.avatarSection}>
                <div
                  style={s.avatarPicker}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} style={s.avatarImg} alt="Preview" />
                  ) : (
                    <div style={s.avatarPlaceholder}>
                      <div style={s.avatarInitial}>{getInitial()}</div>
                    </div>
                  )}
                  <div style={s.avatarOverlay}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>
                <div style={s.avatarHint}>
                  <div style={s.avatarHintTitle}>Profile photo</div>
                  <div style={s.avatarHintSub}>Optional · JPG, PNG under 3MB</div>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarChange}
                style={{display:'none'}}
              />

              <div style={s.fieldGroup}>
                <label style={s.label}>Username</label>
                <input
                  style={s.input}
                  placeholder="e.g. mariasheikh"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <div style={s.fieldHint}>Lowercase, no spaces</div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Display name</label>
                <input
                  style={s.input}
                  placeholder="e.g. Maria Sheikh"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div style={s.fieldGroup}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoCapitalize="none"
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={s.errorBox}>
              {error}
            </div>
          )}

          <button style={s.submitBtn} type="submit" disabled={loading}>
            {loading
              ? (isLogin ? 'Signing in...' : 'Creating account...')
              : (isLogin ? 'Sign in' : 'Create account')
            }
          </button>
        </form>

        {/* Rooms preview pills */}
        <div style={s.previewWrap}>
          <div style={s.previewLabel}>Active right now</div>
          <div style={s.previewPills}>
            {['Gulf War 3.0', 'Anthropic Watch', 'No Ring After 4 Years', 'The Beauty Tax'].map(r => (
              <div key={r} style={s.pill}>
                <div style={s.pillDot} />
                {r}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const s = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#070003',
    padding: '24px 20px',
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Logo
  logoWrap: { textAlign: 'center', marginBottom: '32px' },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '52px',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    color: '#f5e0ea',
    lineHeight: 1,
    marginBottom: '8px',
  },
  tagline: {
    fontSize: '14px',
    color: 'rgba(245,224,234,0.35)',
    letterSpacing: '0.01em',
  },

  // Tabs
  tabs: {
    display: 'flex',
    background: '#1a0010',
    border: '1px solid rgba(192,0,58,0.15)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '24px',
    width: '100%',
  },
  tab: {
    flex: 1,
    padding: '10px',
    borderRadius: '9px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(245,224,234,0.4)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #c0003a, #900030)',
    color: '#fff',
    fontWeight: '600',
  },

  // Form
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '28px',
  },

  // Avatar
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px',
    background: '#0e0007',
    border: '1px solid rgba(192,0,58,0.12)',
    borderRadius: '14px',
  },
  avatarPicker: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    background: '#1a0010',
    border: '1px dashed rgba(192,0,58,0.3)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '20px',
    fontWeight: '700',
    color: 'rgba(192,0,58,0.5)',
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.15s',
  },
  avatarHint: {},
  avatarHintTitle: { fontSize: '14px', fontWeight: '500', color: '#f5e0ea', marginBottom: '3px' },
  avatarHintSub: { fontSize: '11px', color: 'rgba(245,224,234,0.35)' },

  // Fields
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontSize: '10px',
    color: 'rgba(245,224,234,0.35)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: "'Space Mono', monospace",
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    background: '#0e0007',
    border: '1px solid rgba(192,0,58,0.15)',
    borderRadius: '12px',
    color: '#f5e0ea',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  fieldHint: {
    fontSize: '11px',
    color: 'rgba(245,224,234,0.25)',
  },

  // Error
  errorBox: {
    padding: '10px 14px',
    background: 'rgba(192,0,58,0.1)',
    border: '1px solid rgba(192,0,58,0.25)',
    borderRadius: '10px',
    color: '#f08090',
    fontSize: '13px',
    textAlign: 'center',
  },

  // Submit
  submitBtn: {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(135deg, #c0003a, #900030)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '2px',
  },

  // Preview pills
  previewWrap: { width: '100%', textAlign: 'center' },
  previewLabel: {
    fontSize: '10px',
    color: 'rgba(245,224,234,0.2)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '10px',
    fontFamily: "'Space Mono', monospace",
  },
  previewPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    justifyContent: 'center',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 11px',
    borderRadius: '100px',
    background: '#0e0007',
    border: '1px solid rgba(192,0,58,0.12)',
    fontSize: '11px',
    color: 'rgba(245,224,234,0.3)',
  },
  pillDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#c0003a',
    flexShrink: 0,
  },
}
