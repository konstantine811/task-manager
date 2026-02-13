import {
  LandingBackground,
  ChronoNav,
  HeroSection,
  FeaturesGrid,
  SocialProof,
  CTAFooter,
  LandingFooter,
} from "@/components/landing";

export default function Landing() {
  return (
    <div className="text-zinc-300 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200 min-h-screen">
      <LandingBackground />
      <ChronoNav variant="landing" />
      <main className="relative z-10 pt-32 pb-20">
        <HeroSection />
        <SocialProof />
        <FeaturesGrid />
        <CTAFooter />
        <LandingFooter />
      </main>
    </div>
  );
}
