import { motion } from 'framer-motion'
import emblem from '../../assets/images/logo-emblem.webp'
import { useIntro } from '../../modules/intro/IntroContext'

export default function BrandLogo({ dark = false, compact = false }) {
  const { introDone } = useIntro()
  return (
    <span className="flex items-center gap-3">
      {introDone ? (
        <motion.span
          layoutId="brand-logo"
          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          className="block h-10 w-10 overflow-hidden rounded-full bg-white shadow-md ring-2 ring-brand-100"
        >
          <img src={emblem} alt="Logo CMCI" className="h-full w-full object-contain p-0.5" />
        </motion.span>
      ) : (
        <span className="block h-10 w-10" />
      )}
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-base font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>CMCI Convois</span>
          <span className={`block text-[11px] font-medium ${dark ? 'text-brand-200' : 'text-slate-500'}`}>Croisades · Côte d’Ivoire</span>
        </span>
      )}
    </span>
  )
}
