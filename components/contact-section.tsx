import { MapPin, Phone, Clock, Mail } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const info = [
  {
    icon: MapPin,
    label: 'Ünvan',
    lines: ['Nizami küç. 45', 'Bakı, Azərbaycan'],
  },
  {
    icon: Phone,
    label: 'Telefon',
    lines: ['+994 50 123 45 67', '+994 12 345 67 89'],
  },
  {
    icon: Clock,
    label: 'İş saatları',
    lines: ['B.e – Şənbə: 10:00 – 22:00', 'Bazar: 11:00 – 20:00'],
  },
  {
    icon: Mail,
    label: 'E-poçt',
    lines: ['salam@kralbarber.az', 'rezerv@kralbarber.az'],
  },
]

export function ContactSection() {
  return (
    <section id="elaqe" className="scroll-mt-20 border-t border-border/60 bg-card/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="ƏLAQƏ"
          title="Bizi tapın"
          description="Şəhərin mərkəzində, rahat çatım nöqtəsində. Suallarınız üçün hər zaman əlaqədəyik."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 sm:grid-cols-2">
            {info.map((item) => (
              <div key={item.label} className="bg-card p-6">
                <div className="flex size-10 items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-primary">
                  <item.icon className="size-4" aria-hidden="true" />
                </div>
                <p className="mt-4 text-xs tracking-widest text-primary">{item.label.toUpperCase()}</p>
                {item.lines.map((l) => (
                  <p key={l} className="mt-1 text-sm text-muted-foreground">
                    {l}
                  </p>
                ))}
              </div>
            ))}
            <div className="flex items-center gap-3 bg-card p-6 sm:col-span-2">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-sm border border-border px-4 py-2.5 text-xs tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                INSTAGRAM
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-sm border border-border px-4 py-2.5 text-xs tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                FACEBOOK
              </a>
              <a
                href="#rezervasiya"
                className="ml-auto inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
              >
                REZERVASIYA
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <iframe
              title="KRAL BARBER xəritədə"
              src="https://www.openstreetmap.org/export/embed.html?bbox=49.83%2C40.36%2C49.87%2C40.39&layer=mapnik"
              className="h-full min-h-80 w-full grayscale"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
