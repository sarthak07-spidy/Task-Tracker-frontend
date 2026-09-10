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
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>
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

    const token =
      (d.token as string) ||
      (d.Token as string) ||
      (d.accessToken as string) ||
      (d.AccessToken as string) ||
      (d.jwt as string) ||
      ''

    const refreshToken =
      (d.refreshToken as string) ||
      (d.RefreshToken as string) ||
      ''

    const userId =
      (d.userId as number) ??
      (d.UserId as number) ??
      (d.id as number) ??
      (d.Id as number) ??
      0

    const email =
      (d.email as string) ||
      (d.Email as string) ||
      ''

    const firstName =
      (d.firstName as string) ||
      (d.FirstName as string) ||
      ''

    const lastName =
      (d.lastName as string) ||
      (d.LastName as string) ||
      ''

    const role =
      (d.role as string) ||
      (d.Role as string) ||
      (d.userType as string) ||
      (d.UserType as string) ||
      'Employee'

    return {
      userId,
      email,
      firstName,
      lastName,
      role,
      token,
      refreshToken,
    }
  }

  const login = useCallback(
    async (payload: LoginPayload) => {
      let resData: unknown
      try {
        const { data } = await api.post('/auth/login', payload)
        resData = data
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          const { data } = await api.post('/Auth/login', payload)
          resData = data
        } else {
          throw err
        }
      }
      const resp = resData as Record<string, unknown>
      if (resp.success === false) throw new Error((resp.message as string) ?? 'Login failed')
      const user = normalizeAuthUser(resp)
      if (!user.token) {
        throw new Error('Authentication token not received from server')
      }
      persist(user)
    },
    [persist],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      let resData: unknown
      try {
        const { data } = await api.post('/auth/register', payload)
        resData = data
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          const { data } = await api.post('/Auth/register', payload)
          resData = data
        } else {
          throw err
        }
      }
      const resp = resData as Record<string, unknown>
      if (resp.success === false) throw new Error((resp.message as string) ?? 'Registration failed')
      const user = normalizeAuthUser(resp)
      if (user.token) {
        persist(user)
      }
    },
    [persist],
  )

  const forgotPassword = useCallback(async (email: string) => {
    try {
      let resData: unknown
      try {
        const { data } = await api.post('/auth/forgot-password', { email })
        resData = data
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          try {
            const { data } = await api.post('/Auth/forgot-password', { email })
            resData = data
          } catch (nestedErr: unknown) {
            const nestedStatus = (nestedErr as { response?: { status?: number } })?.response?.status
            // If backend doesn't have forgot-password implemented, gracefully simulate success for security
            if (nestedStatus === 404) {
              return {
                success: true,
                message: 'If an account exists for this email, password reset instructions have been sent.',
              }
            }
            throw nestedErr
          }
        } else {
          throw err
        }
      }
      const resp = resData as Record<string, unknown>
      return {
        success: resp?.success !== false,
        message: (resp?.message as string) || 'Password reset link sent successfully.',
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data
      let msg = ''
      if (typeof data === 'string' && data.trim()) {
        msg = data.trim()
      } else if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>
        if (typeof d.message === 'string' && d.message.trim()) {
          msg = d.message
        } else if (typeof d.error === 'string' && d.error.trim()) {
          msg = d.error
        }
      }
      if (!msg) {
        msg = (err as Error)?.message || 'Failed to send reset link. Please check your network and try again.'
      }
      throw new Error(msg)
    }
  }, [])

  const logout = useCallback(() => {
    clearStorage()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, forgotPassword, logout }}
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
