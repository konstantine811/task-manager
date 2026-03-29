import { useState } from "react";
import { Link } from "react-router";
import {
  MousePointer,
  LayoutTemplate,
  CalendarDays,
  BarChart3,
  MoreHorizontal,
  Plus,
  Check,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import { DateTemplate } from "@/config/data-config";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

const TABS = {
  template: "template",
  daily: "daily",
  analytics: "analytics",
} as const;
type TabKey = keyof typeof TABS;

export function AppMockup() {
  const [activeTab, setActiveTab] = useState<TabKey>("template");
  const today = format(new Date(), "EEEE, d MMMM", { locale: uk });

  const TemplateContent = () => (
    <>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <div className="text-xs text-zinc-500 mb-1">{today}</div>
          <div className="text-2xl font-medium text-zinc-900 dark:text-white">Шаблони задач</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Основа для кожного дня: категорії, пріоритети й повторюваність
          </div>
        </div>
        <Link
          to={ROUTES.TEMPLATE}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-4 relative animate-fade-in">
        <div className="grid gap-3">
          {[
            {
              category: "Health",
              task: "Workout",
              meta: "3 рази на тиждень • medium",
            },
            {
              category: "Career",
              task: "Deep work block",
              meta: "ПН, СР, ПТ • high",
            },
            {
              category: "Life",
              task: "Inbox cleanup",
              meta: "кожні 2 дні • low",
            },
          ].map((item) => (
            <div
              key={item.task}
              className="p-4 rounded-lg chrono-task-card group-hover/item:border-zinc-700 group-hover/item:bg-zinc-800 flex justify-between items-start"
            >
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
                  {item.category}
                </div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{item.task}</div>
                <div className="mt-1 text-xs font-mono text-zinc-500">{item.meta}</div>
              </div>
              <div className="rounded-full border border-zinc-300 px-2 py-1 text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                template
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const DailyContent = () => (
    <>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <div className="text-xs text-zinc-500 mb-1">{today}</div>
          <div className="text-2xl font-medium text-zinc-900 dark:text-white">Мій день</div>
        </div>
        <Link
          to={`${ROUTES.DAILY}/${format(new Date(), DateTemplate.dayMonthYear)}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-4 relative animate-fade-in">
        <div className="absolute top-0 bottom-0 left-3 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="relative pl-10 group/item cursor-pointer">
          <div className="absolute left-[9px] top-3 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#09090b]" />
          <div className="p-4 rounded-lg chrono-task-card chrono-task-card-done flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Deep work block</div>
              <div className="mt-1 text-xs font-mono text-emerald-700/80 dark:text-emerald-400/70">09:00 - 11:00</div>
            </div>
            <div className="h-6 w-6 rounded border border-emerald-500/35 flex items-center justify-center text-emerald-500">
              <Check className="w-3 h-3" />
            </div>
          </div>
        </div>
        <div className="relative pl-10 cursor-pointer group/item">
          <div className="absolute left-[9px] top-3 h-1.5 w-1.5 rounded-full bg-zinc-400 ring-4 ring-white transition-colors group-hover/item:bg-zinc-500 dark:bg-zinc-700 dark:ring-[#09090b]" />
          <div className="p-4 rounded-lg chrono-task-card group-hover/item:border-zinc-700 group-hover/item:bg-zinc-800 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-300">Workout</div>
              <div className="mt-1 text-xs font-mono text-zinc-500 dark:text-zinc-600">12:30 - 13:15</div>
            </div>
          </div>
        </div>
        <div className="relative pl-10 cursor-pointer group/item">
          <div className="absolute left-[9px] top-3 h-1.5 w-1.5 rounded-full bg-zinc-400 ring-4 ring-white transition-colors group-hover/item:bg-zinc-500 dark:bg-zinc-700 dark:ring-[#09090b]" />
          <div className="p-4 rounded-lg chrono-task-card group-hover/item:border-zinc-700 group-hover/item:bg-zinc-800 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-300">Inbox cleanup</div>
              <div className="mt-1 text-xs font-mono text-zinc-500 dark:text-zinc-600">17:30 - 18:00</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const AnalyticsContent = () => (
    <>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Обраний діапазон дат</div>
          <div className="text-2xl font-medium text-zinc-900 dark:text-white">Аналітика</div>
        </div>
        <button type="button" className="px-3 py-1 rounded-full chrono-btn-secondary">
          Фільтр
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in">
        <div className="p-4 rounded-xl chrono-card">
          <div className="text-zinc-500 text-xs mb-2">Запланований час</div>
          <div className="flex items-center gap-2 text-xl font-medium text-zinc-900 dark:text-white">
            22.5 год
          </div>
        </div>
        <div className="p-4 rounded-xl chrono-card">
          <div className="text-zinc-500 text-xs mb-2">Виконано</div>
          <div className="text-xl font-medium text-zinc-900 dark:text-white">14 задач</div>
        </div>
      </div>
      <div className="h-40 w-full flex items-end justify-between gap-2 px-2 animate-fade-in">
        {[40, 60, 30, 80, 50, 45, 20].map((h, i) => (
          <div
            key={i}
            className={`w-full transition-colors rounded-t-sm ${
              i === 3 ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-zinc-300 hover:bg-indigo-500/50 dark:bg-zinc-800"
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </>
  );

  const tabContent: Record<TabKey, React.ReactNode> = {
    template: <TemplateContent />,
    daily: <DailyContent />,
    analytics: <AnalyticsContent />,
  };

  return (
    <div className="hero-perspective relative group select-none">
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
        <MousePointer className="w-3 h-3" /> Спробуйте інтерфейс
      </div>
      <div className="absolute top-1/2 left-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[100px]" />
      <div className="hero-rotate relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-300/50 transition-all duration-500 dark:border-white/10 dark:bg-[#09090b] dark:shadow-black">
        <div className="flex h-10 items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 dark:border-white/5 dark:bg-zinc-900/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="flex-1 text-center font-mono text-[10px] text-zinc-500 dark:text-zinc-600">chrono_dashboard.exe</div>
        </div>
        <div className="grid grid-cols-12 h-[500px] text-left">
          <div className="z-20 col-span-2 hidden flex-col items-center gap-6 border-r border-zinc-200 bg-zinc-50/80 py-6 dark:border-white/5 dark:bg-zinc-900/20 sm:col-span-1 md:flex">
            {([
              { key: "template" as const, icon: LayoutTemplate },
              { key: "daily" as const, icon: CalendarDays },
              { key: "analytics" as const, icon: BarChart3 },
            ] as const).map(({ key, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                  activeTab === key
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 scale-105"
                    : "bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
            <div className="mt-auto flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white font-mono text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">JS</div>
          </div>
          <div className="col-span-12 md:col-span-7 p-8 relative overflow-hidden">
            <div className="h-full flex flex-col animate-fade-in">{tabContent[activeTab]}</div>
          </div>
          <div className="col-span-4 hidden border-l border-zinc-200 bg-zinc-50/70 p-6 dark:border-white/5 dark:bg-zinc-900/10 lg:block">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-medium uppercase tracking-widest text-zinc-500">Огляд системи</div>
              <MoreHorizontal className="w-4 h-4 cursor-pointer text-zinc-500 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white" />
            </div>
            <div className="group/chart relative mb-6 h-32 w-full overflow-hidden rounded-lg border border-zinc-200 bg-linear-to-b from-indigo-500/5 to-transparent dark:border-white/5">
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 pb-2 h-full gap-1">
                {[40, 60, 85, 30, 50].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-sm group-hover/chart:opacity-100 transition-all duration-500 ${
                      i === 2 ? "bg-indigo-500 opacity-80 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-zinc-300 group-hover/chart:bg-zinc-400 dark:bg-zinc-800 dark:group-hover/chart:bg-zinc-700"
                    }`}
                    style={{ height: `${h}%`, transitionDelay: `${i * 75}ms` }}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Зараз у продукті</div>
            <div className="p-3 rounded chrono-card mb-2 cursor-pointer">
              <div className="mb-1 text-xs text-zinc-900 dark:text-white">Template categories</div>
              <div className="text-[10px] text-zinc-500">Career, Health, Relationships, Life</div>
            </div>
            <div className="p-3 rounded chrono-card mb-2 cursor-pointer">
              <div className="mb-1 text-xs text-zinc-900 dark:text-white">Daily execution</div>
              <div className="text-[10px] text-zinc-500">done, planned, determined tasks</div>
            </div>
            <div className="p-3 rounded chrono-card cursor-pointer">
              <div className="mb-1 text-xs text-zinc-900 dark:text-white">Analytics + AI</div>
              <div className="text-[10px] text-zinc-500">range insights and quick setup</div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white to-transparent dark:from-[#09090b]" />
      </div>
    </div>
  );
}
