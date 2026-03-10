import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Room from './pages/Room'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Messages from './pages/Messages'
import DMChat from './pages/DMChat'
import Notifications from './pages/Notifications'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#070003', color: '#f5e0ea',
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '32px', fontWeight: '700', letterSpacing: '-0.03em',
    }}>
      poppi
    </div>
  )

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/auth"              element={!session ? <Auth /> : <Navigate to="/" />} />
        <Route path="/"                  element={session ? <Home session={session} /> : <Navigate to="/auth" />} />
        <Route path="/room/:id"          element={session ? <Room session={session} /> : <Navigate to="/auth" />} />
        <Route path="/profile"           element={session ? <Profile session={session} /> : <Navigate to="/auth" />} />
        <Route path="/user/:userId"      element={session ? <UserProfile session={session} /> : <Navigate to="/auth" />} />
        <Route path="/messages"          element={session ? <Messages session={session} /> : <Navigate to="/auth" />} />
        <Route path="/messages/:convId"  element={session ? <DMChat session={session} /> : <Navigate to="/auth" />} />
        <Route path="/notifications"     element={session ? <Notifications session={session} /> : <Navigate to="/auth" />} />
      </Routes>
    </ThemeProvider>
  )
}