'use client'

import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 bg-[#0a0a0a] pointer-events-none"
      style={{ zIndex: 99999 }}
    />
  )
}
