import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  maroon: {
    id: 'maroon', label: 'Maroon',
    bg: '#070003', bg2: '#0e0007', bg3: '#15000c',
    surface: '#1a0010', surface2: '#230018',
    border: 'rgba(180,0,60,0.15)', border2: 'rgba(180,0,60,0.28)',
    text: '#f5e0ea', text2: '#c8a0b8', text3: '#8a5070',
    accent: '#c0003a', accent2: '#900030',
    accentGlow: 'rgba(192,0,58,0.2)',
    pillBg: 'rgba(192,0,58,0.12)',
    online: '#4ade80', hot: '#ff6b35',
  },
  black: {
    id: 'black', label: 'Black',
    bg: '#000000', bg2: '#0a0a0a', bg3: '#111111',
    surface: '#181818', surface2: '#222222',
    border: 'rgba(255,255,255,0.08)', border2: 'rgba(255,255,255,0.14)',
    text: '#f2f2f2', text2: '#aaaaaa', text3: '#666666',
    accent: '#e8b4b8', accent2: '#c49a9e',
    accentGlow: 'rgba(232,180,184,0.15)',
    pillBg: 'rgba(232,180,184,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  gray: {
    id: 'gray', label: 'Gray',
    bg: '#1c1c1c', bg2: '#242424', bg3: '#2c2c2c',
    surface: '#303030', surface2: '#3a3a3a',
    border: 'rgba(255,255,255,0.08)', border2: 'rgba(255,255,255,0.14)',
    text: '#eeeeee', text2: '#b0b0b0', text3: '#777777',
    accent: '#d4a0a4', accent2: '#b87c80',
    accentGlow: 'rgba(212,160,164,0.15)',
    pillBg: 'rgba(212,160,164,0.12)',
    online: '#4ade80', hot: '#ff6b35',
  },
  white: {
    id: 'white', label: 'White',
    bg: '#fafafa', bg2: '#f2f2f2', bg3: '#e8e8e8',
    surface: '#ffffff', surface2: '#f5f5f5',
    border: 'rgba(0,0,0,0.09)', border2: 'rgba(0,0,0,0.16)',
    text: '#111111', text2: '#555555', text3: '#999999',
    accent: '#c2626a', accent2: '#a04850',
    accentGlow: 'rgba(194,98,106,0.12)',
    pillBg: 'rgba(194,98,106,0.08)',
    online: '#16a34a', hot: '#ea580c',
  },
  rosegold: {
    id: 'rosegold', label: 'Rose Gold',
    // Warm blush cream — light, premium, not dark at all
    bg: '#fdf5f0', bg2: '#faeee6', bg3: '#f5e4d8',
    surface: '#ffffff', surface2: '#fdf0ea',
    border: 'rgba(200,120,100,0.14)', border2: 'rgba(200,120,100,0.26)',
    text: '#2a1410', text2: '#7a4a40', text3: '#b08070',
    accent: '#c07860', accent2: '#a05c48',
    accentGlow: 'rgba(192,120,96,0.2)',
    pillBg: 'rgba(192,120,96,0.1)',
    online: '#16a34a', hot: '#ea580c',
  },
  amber: {
    id: 'amber', label: 'Amber',
    bg: '#0a0700', bg2: '#110e00', bg3: '#191400',
    surface: '#201a00', surface2: '#2a2200',
    border: 'rgba(255,185,0,0.12)', border2: 'rgba(255,185,0,0.22)',
    text: '#fff8e0', text2: '#d4a840', text3: '#907020',
    accent: '#ffb800', accent2: '#cc9200',
    accentGlow: 'rgba(255,184,0,0.18)',
    pillBg: 'rgba(255,184,0,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  cobalt: {
    id: 'cobalt', label: 'Cobalt',
    bg: '#00020e', bg2: '#000516', bg3: '#00081f',
    surface: '#000c28', surface2: '#001235',
    border: 'rgba(60,120,255,0.15)', border2: 'rgba(60,120,255,0.28)',
    text: '#e0eaff', text2: '#8aaae0', text3: '#506090',
    accent: '#3070ff', accent2: '#1a50dd',
    accentGlow: 'rgba(48,112,255,0.2)',
    pillBg: 'rgba(48,112,255,0.12)',
    online: '#4ade80', hot: '#ff6b35',
  },
  forest: {
    id: 'forest', label: 'Forest',
    bg: '#010a03', bg2: '#021206', bg3: '#031a09',
    surface: '#04200c', surface2: '#062a12',
    border: 'rgba(0,170,70,0.13)', border2: 'rgba(0,170,70,0.24)',
    text: '#e0f5e8', text2: '#70c090', text3: '#407050',
    accent: '#00c04e', accent2: '#009038',
    accentGlow: 'rgba(0,192,78,0.18)',
    pillBg: 'rgba(0,192,78,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  slate: {
    id: 'slate', label: 'Slate',
    bg: '#07101a', bg2: '#0d1824', bg3: '#13202e',
    surface: '#192838', surface2: '#1f3045',
    border: 'rgba(100,150,210,0.13)', border2: 'rgba(100,150,210,0.24)',
    text: '#dce8f8', text2: '#80a8d0', text3: '#507090',
    accent: '#7eb8f0', accent2: '#5a94cc',
    accentGlow: 'rgba(126,184,240,0.15)',
    pillBg: 'rgba(126,184,240,0.1)',
    online: '#4ade80', hot: '#ff6b35',
  },
  neon: {
    id: 'neon', label: 'Neon',
    bg: '#000000', bg2: '#060606', bg3: '#0c0c0c',
    surface: '#111111', surface2: '#171717',
    border: 'rgba(0,255,120,0.13)', border2: 'rgba(0,255,120,0.24)',
    text: '#e8fff0', text2: '#60d080', text3: '#306840',
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