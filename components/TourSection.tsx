'use client'

import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const TOUR_DATES = [
  { date: 'ABR 09', city: 'Alajuelita',      country: 'Costa Rica',  venue: 'Parque Viva',                      ticket: 'https://www.eticket.cr/paso1a.aspx?idevento=9326&fbclid=PAZnRzaAQX6HhleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAaf3fRlBxFF7THE4vttGDpccu7zuQZaCkgfTml0UkpqIFVXLZR96GwJd68Go1A_aem_IW9dvhT192NGUSapNls-Kg' },
  { date: 'ABR 16', city: 'Managua',        country: 'Nicaragua',   venue: 'Metrocentro',                      ticket: 'https://ticketerani.com/roa2026/' },
  { date: 'ABR 24', city: 'Ciudad de Panamá', country: 'Panamá',   venue: 'Centro de Convenciones Amador',    ticket: 'https://www.bandsintown.com/t/108120908?came_from=2510&user_id=71789943&utm_medium=web&utm_source=artist_page&utm_campaign=ticket' },
  { date: 'ABR 30', city: 'Ciudad de Guatemala', country: 'Guatemala', venue: 'Forum Majadas',               ticket: 'https://shop.weeztix.com/32e04904-26c8-40b7-bb3a-39d16b14538f/tickets?shop_code=7gf585tk' },
  { date: 'MAY 08', city: 'San Salvador',   country: 'El Salvador', venue: 'Complejo Deportivo Cuscatlán',   ticket: 'https://roa.funcapital.com/checkout/AZycWQzU0UJmRjUK4bzy' },
  { date: 'MAY 15', city: 'Bogotá',         country: 'Colombia',    venue: 'Royal Center',                   ticket: 'https://breakfast.checkout.tuboleta.com/selection/event/date?productId=10230365335909' },
  { date: 'MAY 22', city: 'Cali',           country: 'Colombia',    venue: '128 Club',                       ticket: 'https://masboleteria.com/event/roa-pr-en-128-120/register' },
  { date: 'MAY 23', city: 'Miramar',        country: 'Colombia',    venue: 'Discolo Club',                   ticket: 'https://api.whatsapp.com/send?phone=573233172792&text=Saludos%20Tio!%0AQuiero%20ser%20el%20primero%20en%20comprar%20las%20entradas%20para%20ver%20a%20ROA%20en%20D%C3%ADscolo.%0ARegalame%20mas%20Info' },
  { date: 'MAY 28', city: 'Lima',           country: 'Perú',        venue: 'Amphitheater Exposition Park',   ticket: 'https://teleticket.com.pe/roa-latam-tour-2026' },
  { date: 'JUN 05', city: 'Maracaibo',      country: 'Venezuela',   venue: 'Palacio de Eventos',             ticket: 'https://roamac.tuentradaweb.com/' },
  { date: 'JUN 06', city: 'Naguanagua',     country: 'Venezuela',   venue: 'Wynwood Park',                   ticket: 'https://roaval.tuentradaweb.com/' },
  { date: 'JUN 12', city: 'Caracas',        country: 'Venezuela',   venue: 'Terraza del CCCT',               ticket: 'https://roaccs.tuentradaweb.com/' },
]

function TourRow({
  item,
  index,
}: {
  item: (typeof TOUR_DATES)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex items-center justify-between border-b border-white/10 py-5 hover:bg-white/5 transition-colors duration-500 overflow-hidden"
    >
      {/* Hover accent line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-px bg-white/60"
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
        style={{ originY: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Date */}
      <span className="font-tour text-xs tracking-[0.2em] uppercase text-white/40 w-20 shrink-0">
        {item.date}
      </span>

      {/* City + venue */}
      <div className="flex-1 px-6 md:px-12">
        <span className="font-tour text-sm md:text-base tracking-[0.08em] uppercase text-[#f2f2f2] group-hover:text-white transition-colors duration-300">
          {item.city}
        </span>
        <span className="font-tour text-xs tracking-[0.2em] uppercase text-white/35 ml-4 hidden md:inline">
          {item.country}
        </span>
        <span className="font-tour text-[10px] tracking-[0.15em] text-white/20 ml-4 hidden lg:inline">
          {item.venue}
        </span>
      </div>

      {/* Ticket link */}
      <div className="shrink-0">
        <a
          href={item.ticket}
          target="_blank"
          rel="noopener noreferrer"
          className="font-tour text-[10px] tracking-[0.25em] uppercase text-white/50 border border-white/15 px-5 py-2.5 hover:border-white hover:text-white transition-all duration-300 active:scale-[0.98]"
        >
          Entradas
        </a>
      </div>
    </motion.div>
  )
}

export default function TourSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true })
  const sectionRef = useRef<HTMLElement>(null)

  // Parallax — video drifts slower than scroll
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const videoY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section id="tour" ref={sectionRef} className="relative overflow-hidden">
      {/* Video background with parallax */}
      <motion.video
        autoPlay
        loop
        muted
        playsInline
        style={{ y: videoY, zIndex: 0 }}
        className="absolute inset-0 w-full h-full object-cover scale-110"
      >
        <source src="/tour-video.mov" type="video/quicktime" />
        <source src="/tour-video.mov" type="video/mp4" />
      </motion.video>

      {/* Dark overlay — keeps text readable */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background: 'rgba(8,8,8,0.72)',
        }}
      />


      {/* Content */}
      <div className="relative py-28 px-8 md:px-16" style={{ zIndex: 3 }}>
        {/* Section header */}
        <div ref={headerRef} className="mb-16 overflow-hidden">
          <motion.h2
            initial={{ y: '110%' }}
            animate={headerInView ? { y: '0%' } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(3rem,8vw,6rem)] leading-none tracking-[0.05em] text-white"
          >
            TOUR
          </motion.h2>
        </div>

        {/* Border top */}
        <div className="border-t border-white/10" />

        {/* Tour rows */}
        {TOUR_DATES.map((item, i) => (
          <TourRow key={`${item.city}-${i}`} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}
