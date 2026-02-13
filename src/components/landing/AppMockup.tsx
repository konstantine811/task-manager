import { useState } from "react";
import { Link } from "react-router";
import {
  MousePointer,
  Home,
  Calendar,
  BarChart2,
  MoreHorizontal,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import { DateTemplate } from "@/config/data-config";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

const TABS = { home: "home", calendar: "calendar", analytics: "analytics" } as const;
type TabKey = keyof typeof TABS;

export function AppMockup() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const today = format(new Date(), "EEEE, d MMMM", { locale: uk });

  const HomeContent = () => (
    <>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <div className="text-xs text-zinc-500 mb-1">{today}</div>
          <div className="text-2xl font-medium text-white">Мій розклад</div>
        </div>
        <Link
          to={`${ROUTES.DAILY}/${format(new Date(), DateTemplate.dayMonthYear)}`}
          className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <Plus className="text-zinc-400 w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-4 relative animate-fade-in">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-zinc-800" />
        <div className="relative pl-10 group/item cursor-pointer">
          <div className="absolute left-[9px] top-3 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-4 ring-[#09090b]" />
          <div className="p-4 rounded-lg chrono-task-card chrono-task-card-done flex justify-between items-center">
            <div>
              <div className="text-indigo-200 text-sm font-medium">Design System Review</div>
              <div className="text-indigo-400/60 text-xs mt-1 font-mono">10:00 - 11:30</div>
            </div>
            <div className="h-6 w-6 rounded border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Check className="w-3 h-3" />
            </div>
          </div>
        </div>
        <div className="relative pl-10 cursor-pointer group/item">
          <div className="absolute left-[9px] top-3 w-1.5 h-1.5 rounded-full bg-zinc-700 ring-4 ring-[#09090b] group-hover/item:bg-zinc-500 transition-colors" />
          <div className="p-4 rounded-lg chrono-task-card group-hover/item:border-zinc-700 group-hover/item:bg-zinc-800 flex justify-between items-center">
            <div>
              <div className="text-zinc-300 text-sm font-medium">Weekly Sync</div>
              <div className="text-zinc-600 text-xs mt-1 font-mono">12:00 - 12:30</div>
            </div>
          </div>
        </div>
        <div className="relative pl-10 cursor-pointer group/item">
          <div className="absolute left-[9px] top-3 w-1.5 h-1.5 rounded-full bg-zinc-700 ring-4 ring-[#09090b] group-hover/item:bg-zinc-500 transition-colors" />
          <div className="p-4 rounded-lg chrono-task-card group-hover/item:border-zinc-700 group-hover/item:bg-zinc-800 flex justify-between items-center">
            <div>
              <div className="text-zinc-300 text-sm font-medium">Frontend Polish</div>
              <div className="text-zinc-600 text-xs mt-1 font-mono">14:00 - 16:00</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const CalendarContent = () => (
    <>
      <div className="flex justify-between items-end mb-6 animate-fade-in">
        <div>
          <div className="text-xs text-zinc-500 mb-1">{format(new Date(), "MMMM yyyy", { locale: uk })}</div>
          <div className="text-2xl font-medium text-white">Календар</div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="w-8 h-8 rounded-lg chrono-btn-icon">
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <button type="button" className="w-8 h-8 rounded-lg chrono-btn-icon">
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"].map((d) => (
          <div key={d} className="text-[10px] text-zinc-600">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 animate-fade-in">
        {Array.from({ length: 31 }, (_, i) => {
          const day = i + 1;
          const isToday = day === new Date().getDate();
          const hasEvent = [2, 15, new Date().getDate(), 28].includes(day);
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg border flex items-center justify-center text-xs relative hover:bg-zinc-800 transition-colors cursor-pointer ${
                isToday ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-200" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
              }`}
            >
              {day}
              {hasEvent && <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isToday ? "bg-indigo-400" : "bg-zinc-600"}`} />}
            </div>
          );
        })}
      </div>
    </>
  );

  const AnalyticsContent = () => (
    <>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Останні 7 днів</div>
          <div className="text-2xl font-medium text-white">Аналітика</div>
        </div>
        <button type="button" className="px-3 py-1 rounded-full chrono-btn-secondary">Експорт</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in">
        <div className="p-4 rounded-xl chrono-card">
          <div className="text-zinc-500 text-xs mb-2">Фокус час</div>
          <div className="text-xl text-white font-medium flex items-center gap-2">
            34год <span className="text-xs text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">+12%</span>
          </div>
        </div>
        <div className="p-4 rounded-xl chrono-card">
          <div className="text-zinc-500 text-xs mb-2">Виконано</div>
          <div className="text-xl text-white font-medium">18 завдань</div>
        </div>
      </div>
      <div className="h-40 w-full flex items-end justify-between gap-2 px-2 animate-fade-in">
        {[40, 60, 30, 80, 50, 45, 20].map((h, i) => (
          <div
            key={i}
            className={`w-full transition-colors rounded-t-sm ${
              i === 3 ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-zinc-800 hover:bg-indigo-500/50"
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </>
  );

  const tabContent: Record<TabKey, React.ReactNode> = {
    home: <HomeContent />,
    calendar: <CalendarContent />,
    analytics: <AnalyticsContent />,
  };

  return (
    <div className="hero-perspective relative group select-none">
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
        <MousePointer className="w-3 h-3" /> Спробуйте інтерфейс
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/20 blur-[100px] rounded-full" />
      <div className="hero-rotate relative max-w-5xl mx-auto rounded-xl border border-white/10 bg-[#09090b] shadow-2xl shadow-black overflow-hidden transition-all duration-500">
        <div className="h-10 border-b border-white/5 bg-zinc-900/50 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="flex-1 text-center text-[10px] text-zinc-600 font-mono">chrono_dashboard.exe</div>
        </div>
        <div className="grid grid-cols-12 h-[500px] text-left">
          <div className="col-span-2 sm:col-span-1 hidden md:flex flex-col items-center py-6 border-r border-white/5 bg-zinc-900/20 gap-6 z-20">
            {([{ key: "home" as const, icon: Home }, { key: "calendar" as const, icon: Calendar }, { key: "analytics" as const, icon: BarChart2 }] as const).map(
              ({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                    activeTab === key ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 scale-105" : "bg-transparent text-zinc-500 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              )
            )}
            <div className="mt-auto w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-mono border border-zinc-700">JS</div>
          </div>
          <div className="col-span-12 md:col-span-7 p-8 relative overflow-hidden">
            <div className="h-full flex flex-col animate-fade-in">{tabContent[activeTab]}</div>
          </div>
          <div className="col-span-4 border-l border-white/5 bg-zinc-900/10 p-6 hidden lg:block">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Продуктивність</div>
              <MoreHorizontal className="w-4 h-4 text-zinc-600 cursor-pointer hover:text-white" />
            </div>
            <div className="h-32 w-full rounded-lg border border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent relative overflow-hidden mb-6 group/chart">
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 pb-2 h-full gap-1">
                {[40, 60, 85, 30, 50].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-sm group-hover/chart:opacity-100 transition-all duration-500 ${
                      i === 2 ? "bg-indigo-500 opacity-80 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-zinc-800 group-hover/chart:bg-zinc-700"
                    }`}
                    style={{ height: `${h}%`, transitionDelay: `${i * 75}ms` }}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Наступне</div>
            <div className="p-3 rounded chrono-card mb-2 cursor-pointer">
              <div className="text-xs text-white mb-1">Реліз v2.1</div>
              <div className="text-[10px] text-zinc-500">Через 2 дні</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
