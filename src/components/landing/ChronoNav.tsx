import { Link, useLocation, useNavigate } from "react-router";
import { Infinity, ArrowRight, LogOut, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/storage/themeStore";
import { ThemeType } from "@/config/theme-colors.config";
import { ROUTES, getTodayDailyRoute } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ChronoNavProps = {
  /** Right side: landing = Login/Register or Tasks/Logout; app = minimal (logo = home) */
  variant?: "landing" | "app";
};

export function ChronoNav({ variant = "landing" }: ChronoNavProps) {
  const { isAuthenticated, logout, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const onSetTheme = useThemeStore((s) => s.onSetTheme);

  const appNavItems = [
    { to: ROUTES.TEMPLATE, key: "template" },
    { to: ROUTES.DAILY, key: "daily" },
    { to: ROUTES.ANALYTICS, key: "analytics" },
  ];
  const isDailyOrTemplatePage =
    pathname.startsWith(ROUTES.DAILY) || pathname.startsWith(ROUTES.TEMPLATE);

  const toggleTheme = () => {
    onSetTheme(
      selectedTheme === ThemeType.DARK ? ThemeType.LIGHT : ThemeType.DARK,
    );
  };

  const handleLogout = () => {
    logout().then(() => navigate(ROUTES.HOME, { replace: true }));
  };

  const handleGoogleLogin = () => {
    loginWithGoogle()
      .then(() => navigate(getTodayDailyRoute(), { replace: true }))
      .catch((err) => console.error("Google sign-in error:", err));
  };

  return (
    <nav
      data-chrono-app-nav
      className={cn(
        "top-0 w-full z-10 border-b border-zinc-200 dark:border-white/5 bg-white/90 dark:bg-black/50 backdrop-blur-xl",
        isDailyOrTemplatePage ? "pr-15 lg:pr-0" : "pr-0",
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-shadow duration-300">
            <Infinity className="w-4 h-4" />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-white tracking-tight text-sm group-hover:opacity-80 transition-opacity">
            Chrono
          </span>
        </Link>

        {variant === "app" && isAuthenticated && (
          <div className="hidden md:flex items-center gap-2">
            {appNavItems.map((item) => {
              const isActive = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.key}
                  to={
                    item.key === "daily" ? getTodayDailyRoute() : item.to
                  }
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
                      : "text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white",
                  )}
                >
                  {t(`pages.task.${item.key}`)}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              selectedTheme === ThemeType.DARK ? "Світла тема" : "Темна тема"
            }
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
          >
            {selectedTheme === ThemeType.DARK ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
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
              to={getTodayDailyRoute()}
              className="h-7 px-3 bg-white text-black text-xs font-medium rounded-full flex items-center hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {t("nav.to_tasks")} <ArrowRight className="ml-1 w-3 h-3" />
            </Link>
          )}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
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
