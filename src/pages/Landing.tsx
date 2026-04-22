import { useEffect } from "react";
import { useNavigate } from "react-router";
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
import { getTodayDailyRoute } from "@/config/route-paths";
import { hasEnteredAppThisSession } from "@/config/app-session";

export default function Landing() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (hasEnteredAppThisSession()) return;

    navigate(getTodayDailyRoute(), { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && !hasEnteredAppThisSession()) {
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
