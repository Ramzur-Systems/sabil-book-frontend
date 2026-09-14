import { useAuthStore } from '@/stores/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Skip the Authorization header and the 401 refresh dance (login, register). */
  anonymous?: boolean
  /**
   * A publicly readable endpoint. The token is still sent when we have one — a
   * signed-in visitor must get their personalised view — but a 401 means "not
   * signed in", not "session died", so it never clears the session or throws.
   */
  public?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${BASE_URL}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

/**
 * Concurrent 401s must not fire N refresh calls. The first one owns the
 * refresh; the rest await the same promise.
 */
let refreshInFlight: Promise<boolean> | null = null

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    const auth = useAuthStore()
    refreshInFlight = auth.refresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = useAuthStore()
  let response = await send(path, options, options.anonymous ? null : auth.accessToken)

  if (response.status === 401 && !options.anonymous) {
    // On a public endpoint a guest simply has no token; that is not a failure.
    if (options.public && !auth.accessToken) {
      response = await send(path, options, null)
    } else {
      const refreshed = await refreshOnce()
      if (refreshed) {
        response = await send(path, options, auth.accessToken)
      } else if (options.public) {
        auth.clear()
        response = await send(path, options, null)
      } else {
        auth.clear()
        throw new ApiError(401, 'Your session has expired. Sign in again to continue.')
      }
    }
  }

  if (!response.ok) {
    const detail = await safeJson(response)
    throw new ApiError(response.status, messageFor(response.status, detail), detail)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function messageFor(status: number, detail: unknown): string {
  if (detail && typeof detail === 'object' && 'detail' in detail) {
    const value = (detail as { detail: unknown }).detail
    if (typeof value === 'string') return value
  }
  if (status === 403) return "You don't have access to this."
  if (status === 404) return "We couldn't find that."
  if (status === 409) return 'That action conflicts with the current state.'
  if (status >= 500) return 'Something went wrong on our side. Try again shortly.'
  return 'That request could not be completed.'
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
}
