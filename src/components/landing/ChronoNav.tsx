import { Link, useNavigate } from "react-router";
import {
  Infinity,
  ChevronDown,
  Clock,
  BarChart3,
  Users,
  CalendarPlus,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

type ChronoNavProps = {
  /** Right side: landing = Login/Register or Tasks/Logout; app = minimal (logo = home) */
  variant?: "landing" | "app";
};

export function ChronoNav({ variant = "landing" }: ChronoNavProps) {
  const { isAuthenticated, logout, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout().then(() => navigate(ROUTES.HOME, { replace: true }));
  };

  const handleGoogleLogin = () => {
    loginWithGoogle()
      .then(() => navigate(ROUTES.TEMPLATE, { replace: true }))
      .catch((err) => console.error("Google sign-in error:", err));
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-shadow duration-300">
            <Infinity className="w-4 h-4" />
          </div>
          <span className="font-semibold text-white tracking-tight text-sm group-hover:opacity-80 transition-opacity">
            Chrono
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
          <div className="relative group h-16 flex items-center">
            <button
              type="button"
              className="flex items-center gap-1 hover:text-white transition-colors cursor-default"
            >
              Функції
              <ChevronDown className="text-zinc-600 group-hover:text-white transition-colors w-3 h-3 group-hover:rotate-180 duration-300" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[400px] p-2 rounded-2xl dropdown-glass opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out origin-top z-50">
              <div className="grid grid-cols-2 gap-1">
                <Link
                  to={ROUTES.TEMPLATE}
                  className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                >
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <Clock className="w-4 h-4 text-zinc-500 group-hover/item:text-indigo-400 transition-colors" />
                    Focus Mode
                  </div>
                  <span className="text-xs text-zinc-500">Блокування відволікань</span>
                </Link>
                <Link
                  to={ROUTES.ANALYTICS}
                  className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                >
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <BarChart3 className="w-4 h-4 text-zinc-500 group-hover/item:text-indigo-400 transition-colors" />
                    Insights
                  </div>
                  <span className="text-xs text-zinc-500">Аналітика часу</span>
                </Link>
                <a
                  href="#"
                  className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                >
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <Users className="w-4 h-4 text-zinc-500 group-hover/item:text-indigo-400 transition-colors" />
                    Teams
                  </div>
                  <span className="text-xs text-zinc-500">Синхронізація команди</span>
                </a>
                <a
                  href="#"
                  className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                >
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <CalendarPlus className="w-4 h-4 text-zinc-500 group-hover/item:text-indigo-400 transition-colors" />
                    Scheduler
                  </div>
                  <span className="text-xs text-zinc-500">Розумний календар</span>
                </a>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 px-3 pb-1 flex justify-between items-center text-xs text-zinc-500">
                <span>Changelog v2.0</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
          <a href="#" className="hover:text-white transition-colors">
            Метод
          </a>
          <a href="#" className="hover:text-white transition-colors relative">
            Маніфест
            <span className="absolute -top-1 -right-2 w-1 h-1 bg-indigo-500 rounded-full" />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Ціни
          </a>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          {variant === "landing" && !isAuthenticated && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="h-7 px-3 bg-white text-black text-xs font-medium rounded-full flex items-center hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {t("nav.sign_in")} <ArrowRight className="ml-1 w-3 h-3" />
            </button>
          )}
          {variant === "landing" && isAuthenticated && (
            <Link
              to={ROUTES.TEMPLATE}
              className="h-7 px-3 bg-white text-black text-xs font-medium rounded-full flex items-center hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {t("nav.to_tasks")} <ArrowRight className="ml-1 w-3 h-3" />
            </Link>
          )}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors font-medium"
            >
              <LogOut className="w-3 h-3" />
              {t("nav.logout")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
