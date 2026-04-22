import {
  LandingBackground,
  ChronoNav,
  HeroSection,
  FeaturesGrid,
  SocialProof,
  CTAFooter,
  LandingFooter,
} from "@/components/landing";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/page-loader";

export default function Landing() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen font-sans antialiased text-zinc-700 dark:text-zinc-300 selection:bg-indigo-500/30 selection:text-indigo-200">
      <LandingBackground />
      <ChronoNav variant="landing" />
      <main className="relative z-10 pt-32 pb-20">
        <HeroSection />
        <SocialProof />
        <FeaturesGrid />
        <CTAFooter />
      </main>
      <LandingFooter />
    </div>
  );
}
