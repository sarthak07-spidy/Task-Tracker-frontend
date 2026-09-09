import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import api from '../lib/api'
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '../lib/types'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('t_user')
    const token = localStorage.getItem('t_token')
    if (stored && token) {
      try {
        const user: AuthUser = JSON.parse(stored)
        setState({ user, isAuthenticated: true, isLoading: false })
      } catch {
        clearStorage()
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  const persist = useCallback((user: AuthUser) => {
    localStorage.setItem('t_user', JSON.stringify(user))
    localStorage.setItem('t_token', user.token)
    localStorage.setItem('t_refreshToken', user.refreshToken)
    setState({ user, isAuthenticated: true, isLoading: false })
  }, [])

  /** Normalize whatever shape the API returns into our AuthUser */
  function normalizeAuthUser(raw: Record<string, unknown>): AuthUser {
    // Handle both wrapped {success, data: {...}} and direct {...} responses
    const d = (raw.success && raw.data && typeof raw.data === 'object')
      ? (raw.data as Record<string, unknown>)
      : raw

    return {
      userId: (d.userId as number) ?? 0,
      email: (d.email as string) ?? '',
      firstName: (d.firstName as string) ?? '',
      lastName: (d.lastName as string) ?? '',
      role: (d.role as string) ?? (d.userType as string) ?? 'Employee',
      token: (d.token as string) ?? '',
      refreshToken: (d.refreshToken as string) ?? '',
    }
  }

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { data } = await api.post('/auth/login', payload)
      if (data.success === false) throw new Error(data.message ?? 'Login failed')
      const user = normalizeAuthUser(data)
      persist(user)
    },
    [persist],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { data } = await api.post('/auth/register', payload)
      if (data.success === false) throw new Error(data.message ?? 'Registration failed')
      const user = normalizeAuthUser(data)
      persist(user)
    },
    [persist],
  )

  const logout = useCallback(() => {
    clearStorage()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function clearStorage() {
  localStorage.removeItem('t_user')
  localStorage.removeItem('t_token')
  localStorage.removeItem('t_refreshToken')
}

export function useAuth() {

  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
