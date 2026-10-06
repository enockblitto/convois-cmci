import { createRepository } from '../../data/repository'

const repo = createRepository('vehicules', { orderBy: 'immatriculation', ascending: true })

export const vehiculeService = {
  list: (filters) => repo.list(filters),
  remove: (id) => repo.remove(id),
  async save(values) {
    const capacite = Number(values.capacite)
    if (!values.immatriculation?.trim()) throw new Error('L’immatriculation est obligatoire.')
    if (!Number.isInteger(capacite) || capacite < 1) throw new Error('La capacité doit être un entier positif.')
    const all = await repo.list()
    const doublon = all.find(
      (v) => v.immatriculation.toLowerCase() === values.immatriculation.trim().toLowerCase() && v.id !== values.id,
    )
    if (doublon) throw new Error('Un véhicule avec cette immatriculation existe déjà.')
    const { id, ...data } = { ...values, capacite, immatriculation: values.immatriculation.trim().toUpperCase() }
    return id ? repo.update(id, data) : repo.create(data)
  },
}
