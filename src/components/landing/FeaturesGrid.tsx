import { Bot, CalendarDays, ChartColumn, LayoutTemplate } from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      icon: LayoutTemplate,
      title: "Шаблони задач",
      description:
        "Створюйте базовий набір повторюваних задач, розкладайте їх по категоріях і задавайте періодичність для щоденної роботи.",
    },
    {
      icon: CalendarDays,
      title: "План на день",
      description:
        "Підтягуйте задачі з шаблонів у конкретну дату, редагуйте їх під день, відмічайте виконання та керуйте planned або determined задачами.",
    },
    {
      icon: ChartColumn,
      title: 'Аналітика виконання',
      description:
        "Переглядайте статистику за діапазон дат: час, виконані задачі, категорії та зведення по окремих задачах.",
    },
    {
      icon: Bot,
      title: "AI quick start",
      description:
        "Швидко наповнюйте шаблони через AI-помічника та стартові сценарії, коли не хочеться збирати систему вручну з нуля.",
    },
  ];

  return (
    <section id="landing-features" className="max-w-7xl mx-auto px-6 py-32">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="glass-card group relative overflow-hidden rounded-2xl p-8 transition-colors duration-300 hover:bg-zinc-100/80 dark:hover:bg-white/5"
          >
            {title === "Аналітика виконання" && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
            )}
            <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 transition-all group-hover:scale-110 group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:group-hover:bg-zinc-800">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-zinc-900 dark:text-white">{title}</h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
