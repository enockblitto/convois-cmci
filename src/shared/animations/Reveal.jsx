import { motion } from 'framer-motion'
import { fadeUp } from './motion'

export default function Reveal({ children, i = 0, className = '', as = 'div' }) {
  const Comp = motion[as]
  return (
    <Comp className={className} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      {children}
    </Comp>
  )
}
