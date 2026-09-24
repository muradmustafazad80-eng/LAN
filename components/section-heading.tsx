import { Scissors } from 'lucide-react'

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-primary/50" />
        <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.3em] text-primary">
          <Scissors className="size-3.5" aria-hidden="true" />
          {eyebrow}
        </span>
        <span className="h-px w-8 bg-primary/50" />
      </div>
      <h2 className="mt-4 text-balance font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
