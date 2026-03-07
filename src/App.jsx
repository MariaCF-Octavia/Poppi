import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase.jsx'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Room from './pages/Room'
import Profile from './pages/Profile'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#070003',
      color: '#f5e0ea',
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '32px',
      fontWeight: '700',
      letterSpacing: '-0.03em',
    }}>
      poppi
    </div>
  )

  return (
    <Routes>
      <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
      <Route path="/" element={session ? <Home session={session} /> : <Navigate to="/auth" />} />
      <Route path="/room/:id" element={session ? <Room session={session} /> : <Navigate to="/auth" />} />
      <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/auth" />} />
    </Routes>
  )
}
