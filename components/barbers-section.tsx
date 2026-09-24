import { Scissors } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const barbers = [
  {
    name: 'Elvin Məmmədov',
    role: 'Baş Usta / Kurucu',
    img: '/images/barber-1.png',
    exp: '12 il təcrübə',
  },
  {
    name: 'Rəşad Quliyev',
    role: 'Fade & Modern Kəsim Ustası',
    img: '/images/barber-2.png',
    exp: '7 il təcrübə',
  },
  {
    name: 'Kamran Əliyev',
    role: 'Klassik Ülgüc & Saqqal Ustası',
    img: '/images/barber-3.png',
    exp: '15 il təcrübə',
  },
]

export function BarbersSection() {
  return (
    <section id="ustalar" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="KOMANDA"
          title="Sənətinə aşiq ustalar"
          description="Hər biri öz sahəsində illərlə formalaşmış təcrübəyə malik peşəkarlar."
        />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b) => (
            <article
              key={b.name}
              className="group overflow-hidden rounded-lg border border-border/60 bg-card"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={b.img || '/placeholder.svg'}
                  alt={`${b.name} — ${b.role}`}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-[10px] tracking-widest text-primary backdrop-blur-sm">
                  <Scissors className="size-3" aria-hidden="true" />
                  {b.exp}
                </span>
              </div>
              <div className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-serif text-lg font-semibold">{b.name}</h3>
                  <p className="mt-1 text-sm text-primary">{b.role}</p>
                </div>
                <a
                  href="#"
                  aria-label={`${b.name} Instagram profili`}
                  className="inline-flex items-center justify-center rounded-sm border border-border px-3 py-2 text-xs tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  IG
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
