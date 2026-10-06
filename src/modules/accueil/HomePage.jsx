import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BellRing, Bus, CalendarHeart, CheckCircle2, CreditCard, LayoutDashboard, MapPinned, ShieldCheck, Sparkles, Ticket, UserPlus, Users } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import busSunset from '../../assets/images/bus-sunset.webp'
import busFleet from '../../assets/images/bus-fleet.webp'
import busGarage from '../../assets/images/bus-garage.webp'
import busStation from '../../assets/images/bus-station.webp'
import Button from '../../shared/ui/Button'
import CountUp from '../../shared/animations/CountUp'
import Reveal from '../../shared/animations/Reveal'
import { ease, fadeUp, stagger } from '../../shared/animations/motion'
import { Skeleton } from '../../shared/ui/Spinner'
import { useAsync } from '../../shared/useAsync'
import { useIntro } from '../intro/IntroContext'
import { convoiService } from '../convois/convoiService'
import ConvoiCard from '../convois/ConvoiCard'
import { formatDateTime } from '../../core/format'

const HEADLINE = ['Voyagez', 'ensemble', 'vers', 'la', 'croisade.']

const features = [
  { icon: CalendarHeart, title: 'Croisades centralisées', text: 'Toutes les croisades, leurs dates et leurs lieux au même endroit.' },
  { icon: Bus, title: 'Véhicules & conducteurs', text: 'Affectez un car, un conducteur et un responsable à chaque convoi.' },
  { icon: Ticket, title: 'Réservation en ligne', text: 'Réservez votre place en quelques secondes, sans doublon possible.' },
  { icon: CreditCard, title: 'Paiement & reçu', text: 'Mobile Money ou espèces, validé par un responsable, reçu avec QR code.' },
  { icon: Users, title: 'Places en temps réel', text: 'Le nombre de places restantes est mis à jour à chaque réservation.' },
  { icon: LayoutDashboard, title: 'Tableau de bord', text: 'Une vision claire du remplissage, des paiements et des convois.' },
]

const steps = [
  { icon: UserPlus, title: 'Créez votre compte', text: 'Nom, téléphone, email : c’est tout.' },
  { icon: MapPinned, title: 'Choisissez un convoi', text: 'Selon la croisade et votre point de départ.' },
  { icon: CreditCard, title: 'Réglez votre place', text: 'Mobile Money ou espèces auprès du responsable.' },
  { icon: CheckCircle2, title: 'Recevez votre reçu', text: 'Présentez le QR code le jour du départ.' },
]

const villes = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Daloa', 'Man', 'Gagnoa', 'Abengourou', 'Divo']

function Hero({ stats }) {
  const { introDone } = useIntro()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const state = introDone ? 'show' : 'hidden'
  const next = stats?.prochain

  return (
    <section ref={ref} className="relative isolate min-h-[100svh] overflow-hidden bg-navy">
      <motion.img
        src={busSunset}
        alt=""
        style={{ y: imgY, scale: imgScale }}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center] opacity-60"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-transparent to-navy/40" />
      <motion.div
        className="absolute -left-40 top-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-brand-600/30 blur-[140px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <motion.div style={{ y: textY, opacity }} className="container-app flex min-h-[100svh] flex-col justify-center pb-24 pt-32">
        <motion.div initial="hidden" animate={state} variants={stagger(0.09, 0.15)} className="max-w-3xl">
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-brand-200 ring-1 ring-white/15 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> Convois officiels des croisades CMCI
          </motion.span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {HEADLINE.map((w, i) => (
              <span key={i} className="mr-[0.25em] inline-block overflow-hidden pb-2 align-bottom">
                <motion.span
                  className={`inline-block ${i >= 3 ? 'text-gradient' : ''}`}
                  variants={{ hidden: { y: '110%', rotate: 4 }, show: { y: 0, rotate: 0, transition: { duration: 0.9, ease } } }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Réservez votre place dans un car, réglez en Mobile Money et recevez votre reçu instantanément. Les responsables suivent chaque convoi en temps réel.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
            <Button as={Link} to="/convois" size="lg">
              Voir les convois <ArrowRight className="h-5 w-5" />
            </Button>
            <Button as={Link} to="/inscription" size="lg" variant="light">
              Créer mon compte
            </Button>
          </motion.div>
        </motion.div>

        {/* cartes flottantes */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={introDone ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.9, ease }}
          className="absolute bottom-28 right-8 hidden w-72 animate-float rounded-3xl bg-white/10 p-5 text-white ring-1 ring-white/20 backdrop-blur-xl lg:block"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Prochain départ</p>
          <p className="mt-2 font-bold">{next ? `${next.point_depart} → ${next.destination ?? next.croisade?.ville}` : '—'}</p>
          <p className="mt-1 text-sm text-slate-300">{next ? formatDateTime(next.date_depart) : ''}</p>
          {next && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-sky-300"
                initial={{ width: 0 }}
                animate={{ width: `${next.taux_remplissage}%` }}
                transition={{ delay: 1.4, duration: 1.2, ease }}
              />
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.1, duration: 0.9, ease }}
          className="absolute right-72 top-40 hidden items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-2xl xl:flex"
        >
          <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><BellRing className="h-5 w-5" /></span>
          <span>
            <span className="block text-xs text-slate-500">Places disponibles</span>
            <span className="block text-lg font-extrabold text-slate-900">{stats ? <CountUp value={stats.restantes} /> : '—'}</span>
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 flex h-10 w-6 -translate-x-1/2 justify-center rounded-full border-2 border-white/30 pt-2"
        initial={{ opacity: 0 }}
        animate={introDone ? { opacity: 1 } : {}}
        transition={{ delay: 1.6 }}
      >
        <motion.span className="h-2 w-1 rounded-full bg-white" animate={{ y: [0, 12, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
      </motion.div>
    </section>
  )
}

function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-slate-200 bg-white py-5">
      <div className="flex w-max animate-marquee gap-12">
        {[...villes, ...villes].map((v, i) => (
          <span key={i} className="flex items-center gap-3 text-lg font-bold text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> {v}
          </span>
        ))}
      </div>
    </div>
  )
}

function Stats({ stats }) {
  const items = [
    { label: 'Convois programmés', value: stats?.convois },
    { label: 'Places proposées', value: stats?.places },
    { label: 'Places réservées', value: stats?.reservees },
    { label: 'Croisades desservies', value: stats?.croisades },
  ]
  return (
    <section className="container-app py-20">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.label} i={i} className="rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-slate-100">
            <p className="text-4xl font-extrabold text-brand-700 sm:text-5xl">{stats ? <CountUp value={s.value} /> : '—'}</p>
            <p className="mt-2 text-sm font-medium text-slate-500">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="bg-white py-24">
      <div className="container-app">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-semibold text-brand-600">Tout pour organiser vos déplacements</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Fini les listes papier et les doublons</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} i={i}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group h-full rounded-3xl bg-slate-50 p-7 ring-1 ring-slate-100 transition-colors hover:bg-gradient-to-br hover:from-brand-600 hover:to-brand-800"
              >
                <span className="inline-flex rounded-2xl bg-white p-3 text-brand-600 shadow-sm transition group-hover:bg-white/15 group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold transition group-hover:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 transition group-hover:text-brand-100">{f.text}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section className="relative overflow-hidden bg-navy py-24 text-white">
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-600/20 blur-[120px]" />
      <div className="container-app relative">
        <Reveal className="max-w-2xl">
          <p className="font-semibold text-brand-300">Comment ça marche</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Votre place en 4 étapes</h2>
        </Reveal>
        <div className="relative mt-16 grid gap-10 md:grid-cols-4">
          <svg className="absolute left-0 top-7 hidden h-2 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
            <motion.line
              x1="0" y1="1" x2="100" y2="1" stroke="#2f7cff" strokeWidth="0.4" strokeDasharray="1 1"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease }}
            />
          </svg>
          {steps.map((s, i) => (
            <Reveal key={s.title} i={i + 1} className="relative">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
                <s.icon className="h-6 w-6" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">{i + 1}</span>
              </span>
              <h3 className="mt-6 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Upcoming({ convois, loading }) {
  return (
    <section className="container-app py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <Reveal>
          <p className="font-semibold text-brand-600">Départs à venir</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Convois ouverts à la réservation</h2>
        </Reveal>
        <Button as={Link} to="/convois" variant="secondary">
          Tous les convois <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-80" />)
          : convois.map((c, i) => <ConvoiCard key={c.id} convoi={c} i={i} />)}
      </div>
    </section>
  )
}

function Fleet() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60])
  const y2 = useTransform(scrollYProgress, [0, 1], [-40, 40])
  return (
    <section ref={ref} className="bg-white py-24">
      <div className="container-app grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-semibold text-brand-600">Notre flotte</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Des cars confortables, des conducteurs expérimentés</h2>
          <p className="mt-4 leading-relaxed text-slate-500">
            Chaque convoi est associé à un véhicule identifié, un conducteur et un responsable joignable. Les participants savent exactement avec qui ils voyagent.
          </p>
          <ul className="mt-6 space-y-3">
            {['Climatisation et sièges inclinables', 'Responsable de convoi à bord', 'Liste des passagers vérifiée au départ'].map((t) => (
              <li key={t} className="flex items-center gap-3 text-slate-700"><ShieldCheck className="h-5 w-5 text-brand-600" /> {t}</li>
            ))}
          </ul>
        </Reveal>
        <div className="grid grid-cols-2 gap-4">
          <motion.img style={{ y: y1 }} src={busFleet} alt="Flotte de cars" className="h-64 w-full rounded-3xl object-cover shadow-card" />
          <motion.img style={{ y: y2 }} src={busGarage} alt="Cars au garage" className="mt-16 h-64 w-full rounded-3xl object-cover shadow-card" />
          <motion.img style={{ y: y1 }} src={busStation} alt="Gare routière" className="col-span-2 h-56 w-full rounded-3xl object-cover shadow-card" />
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="container-app py-24">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 px-8 py-16 text-center text-white shadow-glow sm:px-16">
        <motion.div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 7, repeat: Infinity }} />
        <motion.div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-sky-400/20" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 9, repeat: Infinity }} />
        <h2 className="relative text-3xl font-extrabold sm:text-5xl">Prêt pour la prochaine croisade ?</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-brand-100">Les places partent vite. Réservez dès maintenant la vôtre et celle de votre famille.</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/convois" size="lg" variant="secondary">Réserver ma place</Button>
        </div>
      </Reveal>
    </section>
  )
}

export default function HomePage() {
  const { data: convois, loading } = useAsync(() => convoiService.list())
  const ouverts = (convois ?? []).filter((c) => c.statut === 'ouvert' && new Date(c.date_depart) > new Date())
  const stats = convois && {
    convois: convois.length,
    places: convois.reduce((s, c) => s + c.places_totales, 0),
    reservees: convois.reduce((s, c) => s + c.places_reservees, 0),
    restantes: ouverts.reduce((s, c) => s + c.places_restantes, 0),
    croisades: new Set(convois.map((c) => c.croisade_id)).size,
    prochain: ouverts[0],
  }
  return (
    <>
      <Hero stats={stats} />
      <Marquee />
      <Stats stats={stats} />
      <Features />
      <Steps />
      <Upcoming convois={ouverts.slice(0, 3)} loading={loading} />
      <Fleet />
      <FinalCta />
    </>
  )
}
