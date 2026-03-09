import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

export default function BottomNav({ onCreateRoom }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme: t } = useTheme()

  const path = location.pathname
  const isHome = path === '/'
  const isMessages = path.startsWith('/messages')
  const isNotifs = path === '/notifications'
  const isProfile = path === '/profile'

  const navItem = (active) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    color: active ? t.accent : t.text3,
    fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em',
    cursor: 'pointer', fontFamily: "'Space Mono',monospace",
  })

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '10px 8px 20px', background: t.bg2, borderTop: `1px solid ${t.border}`, zIndex: 20 }}>
      <div style={navItem(isHome)} onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={isHome ? t.accent : 'none'} stroke={isHome ? t.accent : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        <span>Rooms</span>
      </div>

      <div style={navItem(isMessages)} onClick={() => navigate('/messages')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Messages</span>
      </div>

      <button
        style={{ width: '44px', height: '44px', borderRadius: '14px', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: '0 8px', lineHeight: 1, fontFamily: 'inherit' }}
        onClick={onCreateRoom}
      >+</button>

      <div style={navItem(isNotifs)} onClick={() => navigate('/notifications')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>Notifs</span>
      </div>

      <div style={navItem(isProfile)} onClick={() => navigate('/profile')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </div>
    </div>
  )
}