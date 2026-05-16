import { Infinity } from "lucide-react";
import { Link } from "react-router";
import { ROUTES } from "@/config/routes";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white/70 py-12 dark:border-white/5 dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-500">
          <Infinity className="w-4 h-4" />
          <span className="text-xs">© 2026 Life Focus. Personal task workflow.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-5 text-xs text-zinc-600 dark:text-zinc-500">
          <a href="/#pricing" className="hover:text-zinc-900 dark:hover:text-white">
            Тарифи
          </a>
          <Link to={ROUTES.OFFER} className="hover:text-zinc-900 dark:hover:text-white">
            Оферта
          </Link>
          <Link to={ROUTES.PRIVACY} className="hover:text-zinc-900 dark:hover:text-white">
            Політика конфіденційності
          </Link>
          <Link to={ROUTES.CONTACTS} className="hover:text-zinc-900 dark:hover:text-white">
            Контакти
          </Link>
        </div>
      </div>
    </footer>
  );
}
