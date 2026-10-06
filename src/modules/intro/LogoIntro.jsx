import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import emblem from '../../assets/images/logo-emblem.webp'
import { useIntro } from './IntroContext'
import { ease } from '../../shared/animations/motion'

const TITLE = 'Convois des Croisades'
const DURATION = 3600

/**
 * Introduction animée (style motion design « Jitter ») :
 * anneaux tracés, logo qui se révèle avec flou + reflet lumineux,
 * titre lettre par lettre, puis le logo s'envole vers la barre de navigation.
 */
export default function LogoIntro() {
  const { introDone, finishIntro } = useIntro()
  const reduce = useReducedMotion()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (introDone) return
    document.body.style.overflow = 'hidden'
    const total = reduce ? 900 : DURATION
    const start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / total)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else finishIntro()
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
    }
  }, [introDone, finishIntro, reduce])

  return (
    <AnimatePresence>
      {!introDone && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-navy"
          exit={{ clipPath: 'circle(0% at 50% 45%)', transition: { duration: 0.9, ease } }}
          initial={{ clipPath: 'circle(150% at 50% 45%)' }}
        >
          {/* halo et grille */}
          <motion.div
            className="absolute h-[60vmax] w-[60vmax] rounded-full bg-brand-600/30 blur-[120px]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.1, 1], opacity: [0, 1, 0.8] }}
            transition={{ duration: 2.2, ease }}
          />
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
            {/* anneaux tracés */}
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 200 200">
              <motion.circle
                cx="100" cy="100" r="96" fill="none" stroke="url(#g1)" strokeWidth="1.5" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, ease, delay: 0.15 }}
              />
              <motion.circle
                cx="100" cy="100" r="86" fill="none" stroke="#59a2ff" strokeOpacity="0.35" strokeWidth="0.75" strokeDasharray="2 6"
                initial={{ pathLength: 0, rotate: 0 }}
                animate={{ pathLength: 1, rotate: 180 }}
                style={{ originX: '100px', originY: '100px' }}
                transition={{ duration: 3, ease: 'linear', delay: 0.3 }}
              />
              <defs>
                <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8ec3ff" />
                  <stop offset="100%" stopColor="#1a5ff2" />
                </linearGradient>
              </defs>
            </svg>

            {/* points orbitaux */}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_12px_#8ec3ff]"
                style={{ top: '50%', left: '50%' }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, Math.cos((i * 2 * Math.PI) / 3) * 150, Math.cos((i * 2 * Math.PI) / 3 + 2) * 150],
                  y: [0, Math.sin((i * 2 * Math.PI) / 3) * 150, Math.sin((i * 2 * Math.PI) / 3 + 2) * 150],
                }}
                transition={{ duration: 2.6, delay: 0.4 + i * 0.1, ease }}
              />
            ))}

            {/* logo : élément partagé avec la navbar */}
            <motion.div
              layoutId="brand-logo"
              className="relative h-44 w-44 overflow-hidden rounded-full bg-white shadow-glow ring-4 ring-white/10 sm:h-56 sm:w-56"
              initial={{ scale: 0.55, opacity: 0, filter: 'blur(14px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.45 }}
            >
              <img src={emblem} alt="CMCI" className="h-full w-full object-contain p-3" />
              <motion.span
                className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '400%' }}
                transition={{ duration: 1.1, delay: 1.3, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* titre */}
          <h1 className="relative mt-10 flex overflow-hidden text-2xl font-extrabold tracking-tight text-white sm:text-4xl" aria-label={TITLE}>
            {TITLE.split('').map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="inline-block"
                initial={{ y: '110%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease, delay: 1.35 + i * 0.03 }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-300 sm:text-sm"
            initial={{ opacity: 0, letterSpacing: '0.8em' }}
            animate={{ opacity: 1, letterSpacing: '0.35em' }}
            transition={{ duration: 1, ease, delay: 2 }}
          >
            CMCI · Côte d’Ivoire
          </motion.p>

          {/* progression + passer */}
          <div className="absolute bottom-10 left-1/2 h-[2px] w-48 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-to-r from-brand-400 to-sky-300" style={{ width: `${progress * 100}%` }} />
          </div>
          <button
            onClick={finishIntro}
            className="absolute right-6 top-6 sm:top-auto sm:bottom-6 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/60 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
          >
            Passer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
