import { buildSeed } from './seed'

const KEY = 'cmci-convois-demo-db-v1'
let db = null

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      let migrated = false
      saved.profiles = (saved.profiles ?? []).map((profile) => {
        if (profile.role !== 'responsable') return profile
        migrated = true
        return { ...profile, role: 'admin' }
      })
      if (migrated) localStorage.setItem(KEY, JSON.stringify(saved))
      return saved
    }
  } catch {
    /* données corrompues : on repart du jeu de démo */
  }
  const fresh = buildSeed()
  localStorage.setItem(KEY, JSON.stringify(fresh))
  return fresh
}

const getDb = () => (db ??= load())
const persist = () => localStorage.setItem(KEY, JSON.stringify(getDb()))
const clone = (v) => (v == null ? v : structuredClone(v))

export const demoDb = {
  uid,
  all: (table) => clone(getDb()[table] ?? []),
  find: (table, id) => clone((getDb()[table] ?? []).find((r) => r.id === id) ?? null),
  insert(table, row) {
    const record = { id: uid(), created_at: new Date().toISOString(), ...row }
    getDb()[table].push(record)
    persist()
    return clone(record)
  },
  update(table, id, patch) {
    const rows = getDb()[table]
    const idx = rows.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Enregistrement introuvable')
    rows[idx] = { ...rows[idx], ...patch }
    persist()
    return clone(rows[idx])
  },
  remove(table, id) {
    getDb()[table] = getDb()[table].filter((r) => r.id !== id)
    persist()
  },
  nextCounter(name) {
    const counters = getDb().counters
    counters[name] = (counters[name] ?? 0) + 1
    persist()
    return counters[name]
  },
  reset() {
    localStorage.removeItem(KEY)
    db = null
  },
}

export const latency = (ms = 180) => new Promise((r) => setTimeout(r, ms))
