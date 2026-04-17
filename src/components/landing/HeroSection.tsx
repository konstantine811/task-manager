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
      navigate(ROUTES.APP);
    } else {
      loginWithGoogle()
        .then(() => navigate(ROUTES.APP, { replace: true }))
        .catch((err) => console.error("Google sign-in error:", err));
    }
  };

  const handleShowFeatures = () => {
    document.getElementById("landing-features")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="max-w-5xl mx-auto px-6 text-center animate-fade-in-up">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-500/15 dark:text-indigo-300 mb-8 cursor-pointer">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
        </span>
        Шаблони, день, аналітика та AI в одному просторі
      </div>

      <h1 className="text-glow mb-6 text-5xl font-medium leading-[1.1] tracking-tight text-zinc-900 dark:text-white md:text-7xl">
        Плануйте систему задач,<br />
        <span className="bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-600">
          а не хаос у списках.
        </span>
      </h1>

      <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Chrono допомагає зберігати шаблони задач за категоріями, переносити їх у конкретний
        день, відмічати виконання й дивитися аналітику по часу, категоріях та задачах за період.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
        <button
          type="button"
          onClick={handleStart}
          className="flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-8 font-medium text-white shadow-[0_10px_30px_rgba(15,23,42,0.14)] transition-all hover:scale-105 hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-black dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] dark:hover:bg-zinc-200"
        >
          <Rocket className="w-5 h-5" />
          Розпочати безкоштовно
        </button>
        <button
          type="button"
          onClick={handleShowFeatures}
          className="group flex h-12 items-center gap-2 rounded-full border border-zinc-300 bg-white/80 px-8 font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <Play className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
          Подивитися можливості
        </button>
      </div>

      <AppMockup />
    </section>
  );
}
