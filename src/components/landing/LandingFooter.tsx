import { Infinity } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white/70 py-12 dark:border-white/5 dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-500">
          <Infinity className="w-4 h-4" />
          <span className="text-xs">© 2026 Chrono. Personal task workflow.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-600 dark:text-zinc-500">
          <span>Templates</span>
          <span>Daily planning</span>
          <span>Analytics</span>
          <span>AI assistant</span>
        </div>
      </div>
    </footer>
  );
}
