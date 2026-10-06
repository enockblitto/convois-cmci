import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import busFleet from '../../assets/images/bus-fleet.webp'
import logoFull from '../../assets/images/logo-cmci.webp'
import Button from '../../shared/ui/Button'
import { Field, Input } from '../../shared/ui/Field'
import { ErrorBox } from '../../shared/ui/misc'
import { ease } from '../../shared/animations/motion'
import { useAuth } from './AuthProvider'

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="container-app pb-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-slate-100 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <motion.img src={busFleet} alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease }} />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-brand-900/30" />
          <div className="absolute bottom-0 p-10 text-white">
            <img src={logoFull} alt="CMCI" className="mb-5 h-20 w-20 rounded-2xl bg-white object-contain p-1" />
            <p className="text-2xl font-bold">Ensemble sur la route de la croisade.</p>
            <p className="mt-2 text-sm text-slate-300">Réservez, payez et suivez votre place en toute simplicité.</p>
          </div>
        </div>
        <motion.div className="p-8 sm:p-12" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  if (user) return <Navigate to={location.state?.from ?? '/mon-espace'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate(location.state?.from ?? '/mon-espace', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Connexion" subtitle="Heureux de vous revoir !">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Mot de passe"><Input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <ErrorBox error={error} />
        <Button type="submit" loading={loading} className="w-full" size="lg">Se connecter</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Pas encore de compte ? <Link to="/inscription" className="font-semibold text-brand-600">Créer un compte</Link>
      </p>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  if (user) return <Navigate to="/mon-espace" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 6) return setError(new Error('Le mot de passe doit contenir au moins 6 caractères.'))
    if (form.password !== form.confirm) return setError(new Error('Les mots de passe ne correspondent pas.'))
    setLoading(true)
    try {
      const { needsConfirmation } = await signUp(form)
      if (needsConfirmation) setPending(true)
      else navigate('/mon-espace', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (pending)
    return (
      <AuthShell title="Vérifiez vos emails" subtitle={`Un lien de confirmation a été envoyé à ${form.email}.`}>
        <Button as={Link} to="/connexion">Aller à la connexion</Button>
      </AuthShell>
    )

  return (
    <AuthShell title="Créer un compte" subtitle="Pour réserver votre place dans un convoi.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom"><Input required value={form.prenom} onChange={set('prenom')} /></Field>
        <Field label="Nom"><Input required value={form.nom} onChange={set('nom')} /></Field>
        <Field label="Téléphone" className="sm:col-span-2"><Input required type="tel" placeholder="07 00 00 00 00" value={form.telephone} onChange={set('telephone')} /></Field>
        <Field label="Email" className="sm:col-span-2"><Input required type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Mot de passe"><Input required type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <Field label="Confirmation"><Input required type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></Field>
        <div className="sm:col-span-2"><ErrorBox error={error} /></div>
        <Button type="submit" loading={loading} size="lg" className="sm:col-span-2">Créer mon compte</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà inscrit ? <Link to="/connexion" className="font-semibold text-brand-600">Se connecter</Link>
      </p>
    </AuthShell>
  )
}
