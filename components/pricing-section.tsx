import { Check } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const priceList = [
  { name: 'Klassik saç kəsimi', price: '25', note: 'yuma + styling' },
  { name: 'Saç + saqqal', price: '40', note: 'ən populyar' },
  { name: 'Saqqal formalaşdırma', price: '20', note: 'isti dəsmal daxil' },
  { name: 'Royal ülgüc təraş', price: '30', note: 'ənənəvi ritual' },
  { name: 'Uşaq kəsimi', price: '18', note: '12 yaşa qədər' },
  { name: 'Saç boyama', price: '45', note: 'ton + qulluq' },
]

const vip = {
  name: 'KRAL VIP PAKET',
  price: '75',
  features: [
    'Premium saç kəsimi',
    'Saqqal formalaşdırma + ülgüc',
    'Üz maskası və qulluq',
    'Saç yuma & massaj',
    'Pulsuz içki və qəlyan',
  ],
}

export function PricingSection() {
  return (
    <section id="qiymetler" className="scroll-mt-20 border-y border-border/60 bg-card/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="QİYMƏTLƏR"
          title="Şəffaf və ədalətli qiymətlər"
          description="Gizli ödəniş yoxdur. Premium keyfiyyət, hər büdcəyə uyğun."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <ul>
              {priceList.map((item, i) => (
                <li
                  key={item.name}
                  className="flex items-baseline justify-between gap-4 border-b border-border/40 px-6 py-5 last:border-none"
                  style={{ opacity: 1 }}
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs tracking-wide text-muted-foreground">{item.note}</p>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="hidden flex-1 border-b border-dashed border-border/60 sm:block sm:w-16" />
                    <span className="font-serif text-2xl font-semibold text-primary">
                      {item.price}
                      <span className="ml-0.5 text-sm text-muted-foreground">₼</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-b from-primary/15 to-card p-8">
            <span className="absolute right-5 top-5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-medium tracking-widest text-primary">
              TÖVSİYƏ
            </span>
            <h3 className="font-serif text-xl font-semibold tracking-wide text-primary">
              {vip.name}
            </h3>
            <div className="mt-4 flex items-end gap-1">
              <span className="font-serif text-5xl font-semibold">{vip.price}</span>
              <span className="mb-2 text-lg text-muted-foreground">₼</span>
            </div>
            <ul className="mt-6 space-y-3">
              {vip.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#rezervasiya"
              className="mt-8 inline-flex w-full items-center justify-center rounded-sm bg-primary px-6 py-3.5 text-sm font-medium tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
            >
              PAKETİ SEÇ
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
