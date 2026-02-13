import { useHeaderSizeStore } from "@/storage/headerSizeStore";

const Preloader = () => {
  const hS = useHeaderSizeStore((s) => s.size);
  return (
    <div
      className="fixed w-full left-0 z-20 bottom-0 flex items-center justify-center bg-background/10 backdrop-blur-xs caret-transparent"
      style={{ minHeight: `calc(100vh - ${hS}px)` }}
    >
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
    </div>
  );
};

export default Preloader;
