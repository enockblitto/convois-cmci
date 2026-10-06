import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

export default function CountUp({ value, duration = 1.6, format = (n) => Math.round(n).toLocaleString('fr-FR') }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const text = useTransform(mv, format)

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, Number(value) || 0, { duration, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [inView, value, duration, mv])

  return <motion.span ref={ref}>{text}</motion.span>
}
