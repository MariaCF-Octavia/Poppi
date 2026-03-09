import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  maroon: {
    id: 'maroon', label: 'Maroon',
    bg: '#070003', bg2: '#0e0007', bg3: '#15000c',
    surface: '#1a0010', surface2: '#230018',
    border: 'rgba(180,0,60,0.15)', border2: 'rgba(180,0,60,0.25)',
    text: '#f5e0ea', text2: '#a06080', text3: '#7a4060',
    accent: '#c0003a', accent2: '#900030',
    accentGlow: 'rgba(192,0,58,0.2)',
    pillBg: 'rgba(192,0,58,0.12)',
    online: '#4ade80', hot: '#ff6b35',
  },
  black: {
    id: 'black', label: 'Black',
    bg: '#000000', bg2: '#0a0a0a', bg3: '#111111',
    surface: '#161616', surface2: '#1e1e1e',
    border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
    text: '#f0f0f0', text2: '#888888', text3: '#555555',
    accent: '#e8b4b8', accent2: '#c49a9e',
    accentGlow: 'rgba(232,180,184,0.15)',
    pillBg: 'rgba(232,180,184,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  gray: {
    id: 'gray', label: 'Gray',
    bg: '#1a1a1a', bg2: '#212121', bg3: '#2a2a2a',
    surface: '#2e2e2e', surface2: '#363636',
    border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
    text: '#e8e8e8', text2: '#999999', text3: '#666666',
    accent: '#d4a0a4', accent2: '#b87c80',
    accentGlow: 'rgba(212,160,164,0.15)',
    pillBg: 'rgba(212,160,164,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  white: {
    id: 'white', label: 'White',
    bg: '#fafafa', bg2: '#f4f4f4', bg3: '#eeeeee',
    surface: '#ffffff', surface2: '#f7f7f7',
    border: 'rgba(0,0,0,0.08)', border2: 'rgba(0,0,0,0.14)',
    text: '#111111', text2: '#666666', text3: '#aaaaaa',
    accent: '#c2626a', accent2: '#a04850',
    accentGlow: 'rgba(194,98,106,0.12)',
    pillBg: 'rgba(194,98,106,0.08)',
    online: '#16a34a', hot: '#ea580c',
  },
  rosegold: {
    id: 'rosegold', label: 'Rose Gold',
    bg: '#0d0608', bg2: '#130a0c', bg3: '#1a0f12',
    surface: '#1f1215', surface2: '#291820',
    border: 'rgba(212,160,120,0.12)', border2: 'rgba(212,160,120,0.2)',
    text: '#f5e8e0', text2: '#a08080', text3: '#7a5a5a',
    accent: '#d4a078', accent2: '#b8845c',
    accentGlow: 'rgba(212,160,120,0.2)',
    pillBg: 'rgba(212,160,120,0.12)',
    online: '#4ade80', hot: '#ff6b35',
  },
  amber: {
    id: 'amber', label: 'Amber',
    bg: '#080600', bg2: '#0f0c00', bg3: '#181200',
    surface: '#1e1700', surface2: '#261e00',
    border: 'rgba(255,180,0,0.1)', border2: 'rgba(255,180,0,0.18)',
    text: '#fff8e0', text2: '#a08040', text3: '#7a6020',
    accent: '#ffb800', accent2: '#cc9200',
    accentGlow: 'rgba(255,184,0,0.18)',
    pillBg: 'rgba(255,184,0,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  cobalt: {
    id: 'cobalt', label: 'Cobalt',
    bg: '#00030f', bg2: '#000618', bg3: '#000a22',
    surface: '#000e2e', surface2: '#00143a',
    border: 'rgba(0,100,255,0.15)', border2: 'rgba(0,100,255,0.25)',
    text: '#e0eaff', text2: '#6080c0', text3: '#405080',
    accent: '#2060ff', accent2: '#1040cc',
    accentGlow: 'rgba(32,96,255,0.2)',
    pillBg: 'rgba(32,96,255,0.12)',
    online: '#4ade80', hot: '#ff6b35',
  },
  forest: {
    id: 'forest', label: 'Forest',
    bg: '#010a03', bg2: '#021005', bg3: '#031608',
    surface: '#041c0a', surface2: '#062410',
    border: 'rgba(0,160,60,0.12)', border2: 'rgba(0,160,60,0.22)',
    text: '#e0f5e8', text2: '#508060', text3: '#356045',
    accent: '#00b846', accent2: '#008a32',
    accentGlow: 'rgba(0,184,70,0.18)',
    pillBg: 'rgba(0,184,70,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  slate: {
    id: 'slate', label: 'Slate',
    bg: '#080c12', bg2: '#0e1420', bg3: '#141c2a',
    surface: '#1a2436', surface2: '#202c40',
    border: 'rgba(100,140,200,0.12)', border2: 'rgba(100,140,200,0.2)',
    text: '#dce8f8', text2: '#607090', text3: '#405070',
    accent: '#7eb0e8', accent2: '#5a8cc4',
    accentGlow: 'rgba(126,176,232,0.15)',
    pillBg: 'rgba(126,176,232,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  neon: {
    id: 'neon', label: 'Neon',
    bg: '#000000', bg2: '#050505', bg3: '#0a0a0a',
    surface: '#0f0f0f', surface2: '#141414',
    border: 'rgba(0,255,120,0.12)', border2: 'rgba(0,255,120,0.22)',
    text: '#e8fff0', text2: '#40a060', text3: '#286040',
    accent: '#00ff78', accent2: '#00cc60',
    accentGlow: 'rgba(0,255,120,0.15)',
    pillBg: 'rgba(0,255,120,0.08)',
    online: '#4ade80', hot: '#ff6b35',
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('poppi_theme') || 'maroon')
  const theme = THEMES[themeId] || THEMES.maroon

  function setTheme(id) {
    setThemeId(id)
    localStorage.setItem('poppi_theme', id)
  }

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, allThemes: Object.values(THEMES) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}