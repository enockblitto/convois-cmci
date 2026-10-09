import { IS_DEMO } from '../../core/config'
import { supabase } from '../../core/supabase'
import { demoDb, latency } from '../../data/demoStore'

const SESSION_KEY = 'cmci-convois-demo-session'
const listeners = new Set()
const emit = () => listeners.forEach((cb) => cb())

const demoAuth = {
  async getUser() {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    const u = demoDb.find('auth_users', id)
    return u ? { id: u.id, email: u.email } : null
  },
  onChange(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  async signIn(email, password) {
    await latency(400)
    const u = demoDb.all('auth_users').find((x) => x.email === email.trim().toLowerCase())
    if (!u || u.password !== password) throw new Error('Email ou mot de passe incorrect.')
    localStorage.setItem(SESSION_KEY, u.id)
    emit()
  },
  async signUp({ email, password, nom, prenom, telephone }) {
    await latency(400)
    const mail = email.trim().toLowerCase()
    if (demoDb.all('auth_users').some((x) => x.email === mail)) throw new Error('Un compte existe déjà avec cet email.')
    const user = demoDb.insert('auth_users', { email: mail, password })
    demoDb.insert('profiles', { id: user.id, email: mail, nom, prenom, telephone, role: 'participant' })
    localStorage.setItem(SESSION_KEY, user.id)
    emit()
    return { needsConfirmation: false }
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY)
    emit()
  },
  async getProfile(userId) {
    return demoDb.find('profiles', userId)
  },
}

const supabaseAuth = {
  async getUser() {
    const { data } = await supabase.auth.getSession()
    return data.session?.user ?? null
  },
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(cb, 0)
    })
    return () => data.subscription.unsubscribe()
  },
  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message)
  },
  async signUp({ email, password, nom, prenom, telephone }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nom, prenom, telephone },
        emailRedirectTo: new URL('/connexion', window.location.origin).href,
      },
    })
    if (error) throw new Error(error.message)
    return { needsConfirmation: !data.session }
  },
  async signOut() {
    await supabase.auth.signOut()
  },
  async getProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },
}

export const authRepository = IS_DEMO ? demoAuth : supabaseAuth
