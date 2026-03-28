export function LandingBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute left-1/2 top-0 h-[400px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-indigo-500/14 opacity-60 blur-[100px] dark:bg-indigo-500/10 dark:opacity-50" />
    </div>
  );
}
