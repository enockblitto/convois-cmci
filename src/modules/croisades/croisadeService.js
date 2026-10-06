import { createRepository } from '../../data/repository'

const repo = createRepository('croisades', { orderBy: 'date_debut', ascending: true })

export const croisadeService = {
  list: (filters) => repo.list(filters),
  get: (id) => repo.get(id),
  remove: (id) => repo.remove(id),
  save(values) {
    if (!values.titre?.trim()) throw new Error('Le titre est obligatoire.')
    if (values.date_fin && values.date_debut && values.date_fin < values.date_debut)
      throw new Error('La date de fin doit être après la date de début.')
    const { id, ...data } = values
    return id ? repo.update(id, data) : repo.create(data)
  },
}
