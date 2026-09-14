import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/entities'

const ACCESS_KEY = 'sabil.access'
const REFRESH_KEY = 'sabil.refresh'
const USER_KEY = 'sabil.user'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* private mode / blocked storage — session stays in memory only */
  }
}

function readUser(): User | null {
  const raw = read(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(read(ACCESS_KEY))
  const refreshToken = ref<string | null>(read(REFRESH_KEY))
  const user = ref<User | null>(readUser())

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  const isProvider = computed(() => Boolean(user.value?.isProvider))

  function setSession(session: { access: string; refresh: string; user: User }) {
    accessToken.value = session.access
    refreshToken.value = session.refresh
    user.value = session.user
    write(ACCESS_KEY, session.access)
    write(REFRESH_KEY, session.refresh)
    write(USER_KEY, JSON.stringify(session.user))
  }

  function setUser(next: User) {
    user.value = next
    write(USER_KEY, JSON.stringify(next))
  }

  function clear() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    write(ACCESS_KEY, null)
    write(REFRESH_KEY, null)
    write(USER_KEY, null)
  }

  /**
   * Called by the api client on a 401. Imported lazily to break the
   * client ⇄ store cycle. Returns false when the session is unrecoverable.
   */
  async function refresh(): Promise<boolean> {
    if (!refreshToken.value) return false
    try {
      const { refreshSession } = await import('@/api/auth')
      const tokens = await refreshSession(refreshToken.value)
      accessToken.value = tokens.access
      refreshToken.value = tokens.refresh
      write(ACCESS_KEY, tokens.access)
      write(REFRESH_KEY, tokens.refresh)
      return true
    } catch {
      return false
    }
  }

  return { accessToken, refreshToken, user, isAuthenticated, isProvider, setSession, setUser, clear, refresh }
})
