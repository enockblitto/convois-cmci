const money = new Intl.NumberFormat('fr-FR')

export const formatFCFA = (value) => `${money.format(Number(value) || 0)} FCFA`

export const formatDate = (value, opts = {}) =>
  value
    ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', ...opts })
    : '—'

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export const fullName = (p) => (p ? `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || p.email : '—')

export const toInputDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
