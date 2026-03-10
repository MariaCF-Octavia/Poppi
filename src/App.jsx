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

  // Still loading — don't know auth state yet
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

  // Signed out — show loading screen while redirect happens
  if (session === null) return (
    <ThemeProvider>
      <Routes>
        <Route path="*" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </ThemeProvider>
  )

  // Signed in — render full app, session is guaranteed to be defined here
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/auth"              element={<Navigate to="/" />} />
        <Route path="/"                  element={<Home session={session} />} />
        <Route path="/room/:id"          element={<Room session={session} />} />
        <Route path="/profile"           element={<Profile session={session} />} />
        <Route path="/user/:userId"      element={<UserProfile session={session} />} />
        <Route path="/messages"          element={<Messages session={session} />} />
        <Route path="/messages/:convId"  element={<DMChat session={session} />} />
        <Route path="/notifications"     element={<Notifications session={session} />} />
      </Routes>
    </ThemeProvider>
  )
}