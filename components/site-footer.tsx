import { Scissors } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:px-6 md:text-left">
        <a href="#" className="flex items-center gap-2">
          <Scissors className="size-4 text-primary" aria-hidden="true" />
          <span className="font-serif text-base font-semibold tracking-[0.2em]">
            KRAL<span className="text-primary">BARBER</span>
          </span>
        </a>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} KRAL BARBER. Bütün hüquqlar qorunur.
        </p>
      </div>
    </footer>
  )
}
