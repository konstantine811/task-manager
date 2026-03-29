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
import { getTaskManagerEntryPath } from "@/utils/task-manager-entry-path";
import { hasEnteredAppThisSession } from "@/config/app-session";

export default function Landing() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const skipAutoredirect =
    typeof window !== "undefined" && hasEnteredAppThisSession();

  useEffect(() => {
    if (authLoading || !isAuthenticated || skipAutoredirect) return;
    let cancelled = false;
    void (async () => {
      const path = await getTaskManagerEntryPath();
      if (!cancelled) navigate(path, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, navigate, skipAutoredirect]);

  if (!authLoading && isAuthenticated && !skipAutoredirect) {
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
