import { Spinner } from "@/components/ui/spinner";

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div
      className={`min-h-screen chrono-page-bg flex items-center justify-center ${className ?? ""}`.trim()}
    >
      <Spinner className="size-8 text-zinc-400" />
    </div>
  );
}
