import { Clock, TrendingUp, Users } from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      icon: Clock,
      title: "Глибокий фокус",
      description:
        'Режим "Zen" блокує всі сповіщення та приховує зайві елементи інтерфейсу, коли ви працюєте над важливим завданням.',
    },
    {
      icon: TrendingUp,
      title: "Розумна аналітика",
      description:
        "Chrono аналізує ваші піки продуктивності та пропонує оптимальний час для складних завдань на основі історії.",
    },
    {
      icon: Users,
      title: "Командний ритм",
      description:
        'Синхронізуйте графіки без зайвих зустрічей. Бачте, коли колеги доступні для "deep work", а коли — для дзвінків.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-colors duration-300"
          >
            {title === "Розумна аналітика" && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
            )}
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-zinc-800 transition-all relative z-10">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
