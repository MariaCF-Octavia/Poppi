import { useState } from 'react'
import { supabase } from '../lib/supabase.jsx'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
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
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: username,
          display_name: displayName || username
        })
        alert('Account created! You can now sign in.')
        setIsLogin(true)
      }
    }
    setLoading(false)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>Poppi</div>
        <p style={styles.sub}>The place you build your people.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <input
                style={styles.input}
                placeholder="Username (e.g. mariasheikh — no spaces)"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g,''))}
                required
              />
              <input
                style={styles.input}
                placeholder="Display name (e.g. Maria Sheikh)"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </>
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={styles.toggle}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError('') }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', padding:'20px' },
  card: { width:'100%', maxWidth:'360px', display:'flex', flexDirection:'column', alignItems:'center' },
  logo: { fontFamily:'Georgia, serif', fontSize:'56px', fontWeight:'900', letterSpacing:'-2px', background:'linear-gradient(135deg,#fff,#e0d0ff,#ffb8cc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'8px' },
  sub: { color:'rgba(255,255,255,.4)', fontSize:'15px', marginBottom:'36px', textAlign:'center' },
  form: { width:'100%', display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' },
  input: { width:'100%', padding:'13px 16px', background:'#111', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', color:'#fff', fontSize:'15px', outline:'none', fontFamily:'inherit' },
  btn: { width:'100%', padding:'14px', background:'linear-gradient(135deg,#c02048,#e8547a)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  error: { color:'#f06080', fontSize:'13px', textAlign:'center' },
  toggle: { color:'rgba(255,255,255,.4)', fontSize:'14px' },
  link: { color:'#e8547a', cursor:'pointer', fontWeight:'600' }
}
