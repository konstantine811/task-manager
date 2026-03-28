export function SocialProof() {
  const capabilities = [
    "Google sign-in",
    "Категорії задач",
    "Шаблони та періодичність",
    "Планування на дату",
    "Аналітика за період",
    "AI assistant",
  ];

  return (
    <section className="relative z-20 mt-[-60px] border-y border-zinc-200/80 bg-white/60 py-10 backdrop-blur-sm dark:border-white/5 dark:bg-black/40">
      <div className="max-w-7xl mx-auto px-6">
        <p className="mb-8 text-center font-mono text-xs text-zinc-500 dark:text-zinc-600">ЩО ВЖЕ Є В ЗАСТОСУНКУ</p>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {capabilities.map((name) => (
            <div
              key={name}
              className="flex h-6 items-center gap-2 text-lg font-bold text-zinc-800 dark:text-white"
              title={name}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-800 dark:bg-white" />
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
