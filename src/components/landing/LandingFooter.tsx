import { Infinity } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-12 bg-black">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <Infinity className="w-4 h-4" />
          <span className="text-xs">© 2023 Chrono Inc.</span>
        </div>
        <div className="flex gap-6 text-xs text-zinc-500">
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Twitter</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
