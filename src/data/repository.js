import { IS_DEMO } from '../core/config'
import { supabase } from '../core/supabase'
import { demoDb, latency } from './demoStore'

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

const compare = (key, ascending) => (a, b) => {
  const x = a[key] ?? ''
  const y = b[key] ?? ''
  return (x > y ? 1 : x < y ? -1 : 0) * (ascending ? 1 : -1)
}

/**
 * Couche d'accès aux données : même interface pour Supabase et pour le mode démo.
 */
export function createRepository(table, { orderBy = 'created_at', ascending = false } = {}) {
  if (IS_DEMO) {
    return {
      async list(filters = {}) {
        await latency()
        return demoDb
          .all(table)
          .filter((row) => Object.entries(filters).every(([k, v]) => row[k] === v))
          .sort(compare(orderBy, ascending))
      },
      async get(id) {
        await latency(80)
        return demoDb.find(table, id)
      },
      async create(values) {
        await latency()
        return demoDb.insert(table, values)
      },
      async update(id, values) {
        await latency()
        return demoDb.update(table, id, values)
      },
      async remove(id) {
        await latency()
        demoDb.remove(table, id)
      },
    }
  }

  return {
    async list(filters = {}) {
      let query = supabase.from(table).select('*').order(orderBy, { ascending })
      for (const [k, v] of Object.entries(filters)) query = query.eq(k, v)
      return unwrap(await query)
    },
    async get(id) {
      return unwrap(await supabase.from(table).select('*').eq('id', id).maybeSingle())
    },
    async create(values) {
      return unwrap(await supabase.from(table).insert(values).select().single())
    },
    async update(id, values) {
      return unwrap(await supabase.from(table).update(values).eq('id', id).select().single())
    },
    async remove(id) {
      unwrap(await supabase.from(table).delete().eq('id', id))
    },
  }
}

export async function callRpc(name, params) {
  return unwrap(await supabase.rpc(name, params))
}
