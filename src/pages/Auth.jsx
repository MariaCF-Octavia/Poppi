import { useState } from 'react'
import { supabase } from '../lib/supabase.jsx'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: username.toLowerCase().replace(/\s+/g, '_'),
          display_name: username,
        })
        setMessage('Account created! You are now signed in.')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070003', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'DM Sans,Helvetica Neue,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '42px', fontWeight: '700', color: '#f5e0ea', letterSpacing: '-0.03em', lineHeight: 1 }}>poppi</div>
          <div style={{ fontSize: '13px', color: 'rgba(245,224,234,0.4)', marginTop: '8px' }}>the place you build your people</div>
        </div>

        <div style={{ display: 'flex', background: 'rgba(192,0,58,0.08)', border: '1px solid rgba(192,0,58,0.15)', borderRadius: '14px', padding: '4px', marginBottom: '24px' }}>
          {['login', 'signup'].map(m => (
            <button key={m}
              style={{ flex: 1, padding: '10px', background: mode === m ? 'rgba(192,0,58,0.25)' : 'transparent', border: 'none', borderRadius: '10px', color: mode === m ? '#f5e0ea' : 'rgba(245,224,234,0.4)', fontSize: '13px', fontWeight: mode === m ? '600' : '400', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onClick={() => { setMode(m); setError(''); setMessage('') }}>
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && (
            <input
              style={{ padding: '14px 16px', background: '#0e0007', border: '1px solid rgba(192,0,58,0.2)', borderRadius: '12px', color: '#f5e0ea', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          )}
          <input
            style={{ padding: '14px 16px', background: '#0e0007', border: '1px solid rgba(192,0,58,0.2)', borderRadius: '12px', color: '#f5e0ea', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            style={{ padding: '14px 16px', background: '#0e0007', border: '1px solid rgba(192,0,58,0.2)', borderRadius: '12px', color: '#f5e0ea', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && <div style={{ fontSize: '13px', color: '#ff6b6b', padding: '10px 14px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '10px' }}>{error}</div>}
          {message && <div style={{ fontSize: '13px', color: '#4ade80', padding: '10px 14px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px' }}>{message}</div>}

          <button
            style={{ padding: '15px', background: 'linear-gradient(135deg,#c0003a,#900030)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: '4px' }}
            type="submit"
            disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}