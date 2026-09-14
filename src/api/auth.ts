import { api } from './client'
import type { User } from '@/types/entities'

export interface Session {
  access: string
  refresh: string
  user: User
}

export interface Credentials {
  email: string
  password: string
}

export interface Registration extends Credentials {
  fullName: string
  country: string
  isProvider: boolean
}

export const login = (body: Credentials) =>
  api.post<Session>('/auth/login', body, { anonymous: true })

export const register = (body: Registration) =>
  api.post<Session>('/auth/register', body, { anonymous: true })

export const refreshSession = (refresh: string) =>
  api.post<{ access: string; refresh: string }>('/auth/refresh', { refresh }, { anonymous: true })

export const me = () => api.get<User>('/auth/me')

export const updateMe = (body: Partial<Pick<User, 'fullName' | 'country' | 'preferredLanguage'>>) =>
  api.patch<User>('/auth/me', body)
