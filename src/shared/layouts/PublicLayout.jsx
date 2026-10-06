import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { LayoutDashboard, LogIn, LogOut, Menu, Ticket, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthProvider'
import BrandLogo from './BrandLogo'
import Button from '../ui/Button'
import DemoBanner from './DemoBanner'
import logoFull from '../../assets/images/logo-cmci.webp'

const links = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/convois', label: 'Convois' },
  { to: '/croisades', label: 'Croisades' },
]

function Navbar() {
  const { user, profile, isStaff, signOut } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  const overHero = pathname === '/' && !scrolled
  const linkCls = ({ isActive }) =>
    `relative rounded-full px-4 py-2 text-sm font-semibold transition ${
      overHero ? (isActive ? 'text-white' : 'text-white/75 hover:text-white') : isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
    }`

  const logout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        overHero ? 'bg-transparent py-4' : 'bg-white/80 py-2.5 shadow-sm backdrop-blur-xl'
      }`}
    >
      <nav className="container-app flex items-center justify-between">
        <Link to="/" onClick={() => setOpen(false)}>
          <BrandLogo dark={overHero} />
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className={`absolute inset-0 -z-10 rounded-full ${overHero ? 'bg-white/15' : 'bg-brand-50'}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  {l.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isStaff && (
                <Button as={Link} to="/admin" variant={overHero ? 'light' : 'secondary'} size="sm" icon={LayoutDashboard}>
                  Administration
                </Button>
              )}
              <Button as={Link} to="/mon-espace" variant={overHero ? 'light' : 'primary'} size="sm" icon={Ticket}>
                {profile?.prenom ? `Espace de ${profile.prenom}` : 'Mon espace'}
              </Button>
              <button onClick={logout} className={`rounded-full p-2 ${overHero ? 'text-white/70 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Déconnexion">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Button as={Link} to="/connexion" variant={overHero ? 'light' : 'ghost'} size="sm" icon={LogIn}>
                Connexion
              </Button>
              <Button as={Link} to="/inscription" size="sm">
                Créer un compte
              </Button>
            </>
          )}
        </div>
        <button className={`md:hidden ${overHero ? 'text-white' : 'text-slate-800'}`} onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white shadow-lg md:hidden"
          >
            <div className="container-app flex flex-col gap-1 py-4" onClick={() => setOpen(false)}>
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className="rounded-xl px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  <Link to="/mon-espace" className="rounded-xl px-3 py-2 font-semibold text-brand-700">Mon espace</Link>
                  {isStaff && <Link to="/admin" className="rounded-xl px-3 py-2 font-semibold text-brand-700">Administration</Link>}
                  <button onClick={logout} className="rounded-xl px-3 py-2 text-left font-semibold text-red-600">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link to="/connexion" className="rounded-xl px-3 py-2 font-semibold text-slate-700">Connexion</Link>
                  <Link to="/inscription" className="rounded-xl bg-brand-600 px-3 py-2 text-center font-semibold text-white">Créer un compte</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-navy text-slate-400">
      <div className="container-app grid gap-10 py-14 md:grid-cols-3">
        <div className="flex items-start gap-4">
          <img src={logoFull} alt="CMCI" className="h-20 w-20 rounded-2xl bg-white object-contain p-1" />
          <p className="text-sm leading-relaxed">
            Communauté Missionnaire Chrétienne Internationale — Côte d’Ivoire. Organisation des convois pour les croisades d’évangélisation.
          </p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Navigation</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/convois" className="hover:text-white">Convois disponibles</Link></li>
            <li><Link to="/croisades" className="hover:text-white">Croisades à venir</Link></li>
            <li><Link to="/mon-espace" className="hover:text-white">Mes réservations</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">« Allez par tout le monde »</p>
          <p className="text-sm italic">Marc 16:15</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs">© {new Date().getFullYear()} CMCI Côte d’Ivoire · Tous droits réservés</div>
    </footer>
  )
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={`flex-1 ${pathname === '/' ? '' : 'pt-24'}`}>
        <Outlet />
      </main>
      <Footer />
      <DemoBanner />
    </div>
  )
}
