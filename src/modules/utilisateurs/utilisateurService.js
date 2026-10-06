import { createRepository } from '../../data/repository'

const repo = createRepository('profiles', { orderBy: 'created_at', ascending: false })

export const utilisateurService = {
  list: (filters) => repo.list(filters),
  async listSafe() {
    try {
      return await repo.list()
    } catch {
      return []
    }
  },
  setRole: (id, role) => repo.update(id, { role }),
}
