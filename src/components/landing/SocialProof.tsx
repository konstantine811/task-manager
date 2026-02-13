export function SocialProof() {
  const companies = ["Acme", "Vertex", "Spherule", "GlobalBank", "Nietzsche"];

  return (
    <section className="border-y border-white/5 bg-black/40 backdrop-blur-sm py-10 mt-[-60px] relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs text-zinc-600 font-mono mb-8">ДОВІРЯЮТЬ КОМАНДИ З</p>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {companies.map((name) => (
            <div key={name} className="h-6 flex items-center gap-2 font-bold text-lg text-white cursor-help" title={name}>
              <div className="w-5 h-5 bg-white rounded-full" />
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
