import { Star, Quote } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const reviews = [
  {
    name: 'Tural H.',
    text: 'Şəhərdə ən yaxşı barbershop. Elvin usta işini mükəmməl bilir, hər dəfə tam istədiyim görünüşü alıram.',
  },
  {
    name: 'Nicat A.',
    text: 'VIP paketi aldım — ülgüc təraş və üz maskası inanılmaz idi. Atmosfer həqiqətən premium.',
  },
  {
    name: 'Orxan M.',
    text: 'Saqqal formalaşdırma üçün gəlirəm. Detallara diqqət və peşəkarlıq başqa səviyyədədir.',
  },
  {
    name: 'Səməd V.',
    text: 'Rezervasiya sistemi çox rahatdır, gözləmə yoxdur. Qiymət-keyfiyyət balansı əladır.',
  },
]

export function ReviewsSection() {
  return (
    <section id="reyler" className="scroll-mt-20 border-y border-border/60 bg-card/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="RƏYLƏR"
          title="Müştərilərimiz nə deyir"
          description="8000-dən çox məmnun müştəri və 4.9 ortalama reytinq bizim keyfiyyətimizin göstəricisidir."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {reviews.map((r) => (
            <figure
              key={r.name}
              className="relative rounded-lg border border-border/60 bg-card p-8"
            >
              <Quote
                className="absolute right-6 top-6 size-8 text-primary/20"
                aria-hidden="true"
              />
              <div className="flex items-center gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 text-pretty leading-relaxed text-foreground/90">
                “{r.text}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-serif text-sm font-semibold text-primary">
                  {r.name.charAt(0)}
                </span>
                <span className="text-sm font-medium">{r.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
