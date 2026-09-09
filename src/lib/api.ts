import axios from 'axios'
import { API_BASE_URL } from './constants'
import type { ApiResponse, RefreshResponse } from './types'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ─── Request interceptor: inject JWT ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('t_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor: handle 401 + token refresh ───────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else {
      p.resolve(token!)
    }
  })
  failedQueue = []
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    const payload = JSON.parse(jsonPayload)
    if (!payload.exp) return false
    // Buffer by 15 seconds
    return Date.now() >= (payload.exp - 15) * 1000
  } catch {
    return false
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url = (originalRequest?.url as string) || ''
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')

    // If 401 and not an auth endpoint
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const data = error.response?.data
      const msg = typeof data === 'string' ? data : (data?.message || '')
      const isRoleOrPermission =
        msg.toLowerCase().includes('only superadmin') ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('forbidden')

      const token = localStorage.getItem('t_token')
      const tokenStillValid = token && !isTokenExpired(token)

      // If it's a role/permission denial OR token has not expired yet, DO NOT LOG OUT
      if (isRoleOrPermission || tokenStillValid) {
        return Promise.reject(error)
      }

      const refreshToken = localStorage.getItem('t_refreshToken')
      if (refreshToken && refreshToken !== 'undefined' && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((t) => {
            originalRequest.headers.Authorization = `Bearer ${t}`
            return api(originalRequest)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const { data: refreshData } = await axios.post<ApiResponse<RefreshResponse>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
          )

          const newToken = refreshData.data.token
          const newRefreshToken = refreshData.data.refreshToken

          localStorage.setItem('t_token', newToken)
          localStorage.setItem('t_refreshToken', newRefreshToken)

          isRefreshing = false
          processQueue(null, newToken)

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch (refreshError) {
          isRefreshing = false
          processQueue(refreshError, null)
          clearAuth()
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth'
          }
          return Promise.reject(refreshError)
        }
      }

      // No valid token and no refresh token
      clearAuth()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth'
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

function clearAuth() {
  localStorage.removeItem('t_token')
  localStorage.removeItem('t_refreshToken')
  localStorage.removeItem('t_user')
}

export default api
