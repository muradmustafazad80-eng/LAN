'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Scissors, Sparkles, Droplets, Crown, Flame } from 'lucide-react'
import { SectionHeading }  from '@/components/section-heading'

interface ServiceItem {
  id: string
  name: string
  price: number
  duration: number
  category: string
}

const iconMap: Record<string, any> = {
  'Hair': Scissors,
  'Beard': Flame,
  'Care': Droplets,
  'VIP': Crown,
}

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-zinc-500 font-mono">Yüklənir...</div>

  return (
    <section id="services" className="relative py-24 md:py-32 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.03),transparent_50%)]" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          eyebrow="XİDMƏTLƏR"
          title="Premium Xidmətlərimiz"
          description ="Hər bir detal lüks və rahatlığınız üçün düşünülüb"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-12 md:mt-16">
          {services.map((service, index) => {
            const IconComponent = iconMap[service.category] || Sparkles
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4, borderColor: 'rgba(217, 119, 6, 0.3)' }}
                className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-b from-zinc-900/40 to-zinc-950/60 border border-zinc-800/40 backdrop-blur-md flex items-start gap-5 transition-all duration-300 group"
              >
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500 group-hover:bg-amber-500/10 group-hover:text-amber-400 transition-all duration-300">
                  <IconComponent className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-xl font-medium text-zinc-100 group-hover:text-amber-400 transition-colors duration-300 truncate">
                      {service.name}
                    </h3>
                    <span className="text-xl font-bold font-mono text-amber-500 shrink-0">
                      {service.price} AZN
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                    Müddət: {service.duration} dəqiqə • Kateqoriya: {service.category}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
