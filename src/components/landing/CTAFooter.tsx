import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";

export function CTAFooter() {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate(ROUTES.TEMPLATE);
      return;
    }

    loginWithGoogle()
      .then(() => navigate(ROUTES.TEMPLATE, { replace: true }))
      .catch((err) => console.error("Google sign-in error:", err));
  };

  return (
    <section className="mx-auto max-w-4xl border-t border-zinc-200/80 px-6 py-20 text-center dark:border-white/5">
      <h2 className="mb-6 text-3xl font-medium tracking-tight text-zinc-900 dark:text-white md:text-4xl">
        Побудуйте свої шаблони і перейдіть до реального дня
      </h2>
      <p className="mb-10 text-zinc-600 dark:text-zinc-400">
        У поточній версії Chrono ви вже можете зібрати структуру задач, працювати з днем і
        дивитися аналітику без зайвих екранів та складного онбордингу.
      </p>
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-zinc-200/80 transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:shadow-white/5 dark:hover:bg-zinc-200"
        >
          Відкрити застосунок <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-600">
        Вхід через Google. Основний сценарій: шаблони, day view, analytics, AI support.
      </p>
    </section>
  );
}
