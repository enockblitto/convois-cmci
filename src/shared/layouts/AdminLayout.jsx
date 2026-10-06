import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Bus, CalendarHeart, Home, LayoutDashboard, LogOut, Menu, Route, Ticket, UserCog, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthProvider'
import { ROLES } from '../../core/constants'
import { fullName } from '../../core/format'
import BrandLogo from './BrandLogo'
import DemoBanner from './DemoBanner'

const nav = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/reservations', label: 'Réservations', icon: Ticket },
  { to: '/admin/paiements', label: 'Paiements', icon: Banknote },
  { to: '/admin/convois', label: 'Convois', icon: Route, admin: true },
  { to: '/admin/croisades', label: 'Croisades', icon: CalendarHeart, admin: true },
  { to: '/admin/vehicules', label: 'Véhicules', icon: Bus, admin: true },
  { to: '/admin/conducteurs', label: 'Conducteurs', icon: UserCog, admin: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs & rôles', icon: Users, admin: true },
]

function Sidebar({ onNavigate }) {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col bg-navy p-5 text-slate-300">
      <Link to="/" className="mb-8 px-2" onClick={onNavigate}>
        <BrandLogo dark />
      </Link>
      <nav className="flex-1 space-y-1">
        {nav
          .filter((n) => !n.admin || isAdmin)
          .map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'text-white' : 'hover:bg-white/5 hover:text-white'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="admin-nav" className="absolute inset-0 -z-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-lg shadow-brand-900/50" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                  )}
                  <n.icon className="relative h-4 w-4" />
                  <span className="relative">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>
      <div className="mt-6 rounded-2xl bg-white/5 p-4">
        <p className="truncate text-sm font-semibold text-white">{fullName(profile)}</p>
        <p className="text-xs text-brand-300">{ROLES[profile?.role]}</p>
        <div className="mt-3 flex gap-2">
          <Link to="/" onClick={onNavigate} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-xs hover:bg-white/10">
            <Home className="h-3.5 w-3.5" /> Site
          </Link>
          <button
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-xs hover:bg-red-500/20 hover:text-red-200"
          >
            <LogOut className="h-3.5 w-3.5" /> Quitter
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 lg:block">
        <Sidebar />
      </aside>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <BrandLogo compact />
        <button onClick={() => setOpen(true)} aria-label="Menu"><Menu /></button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
            <motion.aside className="absolute inset-y-0 left-0 w-72" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <Sidebar onNavigate={() => setOpen(false)} />
              <button className="absolute right-3 top-5 text-white" onClick={() => setOpen(false)} aria-label="Fermer"><X /></button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="lg:pl-72">
        <motion.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl p-4 sm:p-8">
          <Outlet />
        </motion.div>
      </main>
      <DemoBanner />
    </div>
  )
}
