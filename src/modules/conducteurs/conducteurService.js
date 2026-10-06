import { createRepository } from '../../data/repository'

const repo = createRepository('conducteurs', { orderBy: 'nom', ascending: true })

export const conducteurService = {
  list: (filters) => repo.list(filters),
  remove: (id) => repo.remove(id),
  save(values) {
    if (!values.nom?.trim() || !values.telephone?.trim()) throw new Error('Le nom et le téléphone sont obligatoires.')
    const { id, ...data } = values
    return id ? repo.update(id, data) : repo.create(data)
  },
}
