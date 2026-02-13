import { useNavigate } from "react-router";
import { Rocket, Play } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { AppMockup } from "./AppMockup";

export function HeroSection() {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate(ROUTES.TEMPLATE);
    } else {
      loginWithGoogle()
        .then(() => navigate(ROUTES.TEMPLATE, { replace: true }))
        .catch((err) => console.error("Google sign-in error:", err));
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-6 text-center animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8 hover:bg-indigo-500/20 transition-colors cursor-pointer">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
        </span>
        Chrono 2.0 вже доступна
      </div>

      <h1 className="text-5xl md:text-7xl font-medium text-white tracking-tight mb-6 text-glow leading-[1.1]">
        Керуйте часом,<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600">
          а не просто задачами.
        </span>
      </h1>

      <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Синхронізуйте ваш ритм життя з продуктивністю. Інтуїтивний планувальник для інженерів,
        дизайнерів та творців.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
        <button
          type="button"
          onClick={handleStart}
          className="h-12 px-8 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <Rocket className="w-5 h-5" />
          Розпочати безкоштовно
        </button>
        <button
          type="button"
          className="h-12 px-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2 group"
        >
          <Play className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
          Як це працює
          <span className="text-xs text-zinc-600 ml-1">2 хв</span>
        </button>
      </div>

      <AppMockup />
    </section>
  );
}
