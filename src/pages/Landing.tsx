import { useEffect } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
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
import { ROUTES } from "@/config/route-paths";
import { DateTemplate } from "@/config/data-config";

export default function Landing() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const today = format(new Date(), DateTemplate.dayMonthYear);
    navigate(`${ROUTES.DAILY}/${today}`, { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  if (!authLoading && isAuthenticated) {
    return (
      <div className="min-h-screen chrono-page-bg flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading…</div>
      </div>
    );
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
