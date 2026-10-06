import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../shared/ui/Button'
import { Field, Input, Select, Textarea } from '../../shared/ui/Field'
import Modal from '../../shared/ui/Modal'
import { EmptyState, ErrorBox, PageHeader } from '../../shared/ui/misc'
import { Skeleton } from '../../shared/ui/Spinner'
import { useToast } from '../../shared/ui/Toast'
import { useAsync } from '../../shared/useAsync'

/**
 * Page CRUD générique pilotée par configuration (colonnes + champs de formulaire).
 * fields: [{ name, label, type: 'text'|'number'|'date'|'datetime-local'|'select'|'textarea'|'tel', options, required, full, toInput }]
 */
export default function ResourcePage({ title, subtitle, load, save, remove, columns, fields, defaults = {}, searchText, extraData }) {
  const notify = useToast()
  const { data, loading, error, reload } = useAsync(async () => {
    const [rows, extra] = await Promise.all([load(), extraData ? extraData() : null])
    return { rows, extra }
  })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)
  const [q, setQ] = useState('')

  const rows = useMemo(
    () => (data?.rows ?? []).filter((r) => !q || (searchText?.(r) ?? JSON.stringify(r)).toLowerCase().includes(q.toLowerCase())),
    [data, q, searchText],
  )
  const resolvedFields = typeof fields === 'function' ? fields(data?.extra) : fields

  const open = (row) => {
    setFormError(null)
    const initial = { ...defaults }
    if (row) {
      initial.id = row.id
      resolvedFields.forEach((f) => (initial[f.name] = f.toInput ? f.toInput(row[f.name]) : (row[f.name] ?? '')))
    }
    setEditing(initial)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await save(editing)
      notify(editing.id ? 'Modifications enregistrées.' : 'Élément créé.')
      setEditing(null)
      reload()
    } catch (err) {
      setFormError(err)
    } finally {
      setBusy(false)
    }
  }

  const del = async (row) => {
    if (!confirm('Supprimer cet élément ? Cette action est irréversible.')) return
    try {
      await remove(row.id)
      notify('Élément supprimé.')
      reload()
    } catch (err) {
      notify(err.message.includes('foreign key') ? 'Impossible : cet élément est utilisé ailleurs.' : err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={<Button icon={Plus} onClick={() => open(null)}>Ajouter</Button>} />
      <div className="mb-4 max-w-sm">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Skeleton className="h-72" />
      ) : rows.length ? (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((c) => <th key={c.label} className="px-5 py-3.5 font-semibold">{c.label}</th>)}
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-t border-slate-100 hover:bg-brand-50/40"
                  >
                    {columns.map((c) => <td key={c.label} className="px-5 py-3.5 text-slate-700">{c.render ? c.render(row, data?.extra) : row[c.key]}</td>)}
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <button onClick={() => open(row)} className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(row)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Rien pour l’instant" text="Commencez par ajouter un premier élément." action={<Button icon={Plus} onClick={() => open(null)}>Ajouter</Button>} />
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Modifier — ${title}` : `Ajouter — ${title}`} size="max-w-2xl">
        {editing && (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {resolvedFields.map((f) => {
              const props = {
                value: editing[f.name] ?? '',
                required: f.required,
                onChange: (e) => setEditing({ ...editing, [f.name]: e.target.value }),
              }
              return (
                <Field key={f.name} label={f.label} hint={f.hint} className={f.full ? 'sm:col-span-2' : ''}>
                  {f.type === 'select' ? (
                    <Select {...props} options={f.options} placeholder={f.placeholder ?? (f.required ? undefined : '— Aucun —')} />
                  ) : f.type === 'textarea' ? (
                    <Textarea {...props} />
                  ) : (
                    <Input type={f.type ?? 'text'} min={f.min} step={f.step} {...props} />
                  )}
                </Field>
              )
            })}
            <div className="sm:col-span-2"><ErrorBox error={formError} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
              <Button type="submit" loading={busy}>Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
