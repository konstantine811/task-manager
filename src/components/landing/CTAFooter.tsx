export function CTAFooter() {
  return (
    <section className="max-w-4xl mx-auto px-6 text-center py-20 border-t border-white/5">
      <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-6">Готові оптимізувати свій день?</h2>
      <p className="text-zinc-400 mb-10">Приєднуйтесь до 10,000+ професіоналів, які вже використовують Chrono.</p>
      <form className="max-w-sm mx-auto flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="example@work.com"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="bg-white text-black text-sm font-medium px-5 py-2 rounded-lg hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
        >
          Почати
        </button>
      </form>
      <p className="text-xs text-zinc-600 mt-4">14 днів безкоштовно. Кредитна карта не потрібна.</p>
    </section>
  );
}
