import { SiteHeader } from '@/components/site-header'
import WorkingHours from '@/components/working-hours'
import { HeroSection } from '@/components/hero-section'
import ServicesSection from '@/components/services-section'
import { HairstylePreviewSection } from '@/components/hairstyle-preview-section'
import { PricingSection } from '@/components/pricing-section'
import { BarbersSection } from '@/components/barbers-section'
import { ReviewsSection } from '@/components/reviews-section'
import { ReservationSection } from '@/components/reservation-section'
import { ContactSection } from '@/components/contact-section'
import { SiteFooter } from '@/components/site-footer'
import { CinematicIntro } from '@/components/animations/cinematic-intro'
import { SpotlightSection } from '@/components/animations/spotlight-section'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <WorkingHours />
      <CinematicIntro />
      <SiteHeader />
      <main>
        <HeroSection />
        <SpotlightSection>
          <ServicesSection />
        </SpotlightSection>
        <SpotlightSection>
          <HairstylePreviewSection />
        </SpotlightSection>
        <SpotlightSection>
          <PricingSection />
        </SpotlightSection>
        <SpotlightSection>
          <BarbersSection />
        </SpotlightSection>
        <SpotlightSection>
          <ReviewsSection />
        </SpotlightSection>
        <SpotlightSection>
          <ReservationSection />
        </SpotlightSection>
        <SpotlightSection>
          <ContactSection />
        </SpotlightSection>
      </main>
      <SiteFooter />
    </div>
  )
}
