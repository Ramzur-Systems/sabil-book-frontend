import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../api/types'
import { marketplace } from '../api/marketplace'

export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null)
  const signedIn = computed(() => user.value !== null)
  async function login(email: string, password: string) {
    user.value = await marketplace.signIn(email, password)
  }
  async function register(name: string, email: string, password: string) {
    user.value = await marketplace.register(name, email, password)
  }
  async function logout() {
    await marketplace.signOut()
    user.value = null
  }
  async function restore() {
    try {
      user.value = await marketplace.currentUser()
    } catch {
      user.value = null
    }
  }
  return { user, signedIn, login, register, logout, restore }
})
