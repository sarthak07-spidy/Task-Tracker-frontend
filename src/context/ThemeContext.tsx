import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'crazy'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('t_theme') as Theme
    if (saved === 'dark' || saved === 'light' || saved === 'crazy') {
      return saved
    }
    return 'dark'
  })

  useEffect(() => {
    localStorage.setItem('t_theme', theme)
    const root = document.documentElement
    root.setAttribute('data-theme', theme)

    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark', 'crazy')
    } else if (theme === 'crazy') {
      root.classList.add('crazy', 'dark')
      root.classList.remove('light')
    } else {
      root.classList.add('dark')
      root.classList.remove('light', 'crazy')
    }
  }, [theme])

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
  }

  function toggleTheme() {
    setThemeState((curr) => {
      if (curr === 'dark') return 'light'
      if (curr === 'light') return 'crazy'
      return 'dark'
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
