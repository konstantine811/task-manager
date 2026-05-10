import { Button } from "@/components/ui/button";
import { ROUTES, getTodayDailyRoute } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DOCUMENTATION_IMAGE_KEYS,
  type DocumentationImageKey,
  type DocumentationImages,
  loadDocumentationImages,
  uploadDocumentationImage,
} from "@/services/firebase/documentationImages";
import { fetchBillingMe } from "@/services/billing/proxy-client";
import {
  BarChart3,
  CalendarCheck,
  Camera,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type GuideImageSlotProps = {
  imageKey: DocumentationImageKey;
  title: string;
  eyebrow: string;
  imageUrl?: string;
  isAdmin: boolean;
  onUpload: (key: DocumentationImageKey, file: File) => Promise<void>;
  className?: string;
};

const guideSteps = [
  {
    number: "01",
    title: "Створи шаблон задач",
    text: "Шаблон — це твій базовий ритм. Розклади регулярні задачі по сферах життя: здоров'я, кар'єра, фінанси, стосунки, емоції та розвиток.",
    bullets: ["Додай категорії", "Вкажи тривалість", "Познач визначені задачі з часом"],
    icon: LayoutDashboard,
    imageKey: "templates" as const,
  },
  {
    number: "02",
    title: "Плануй і виконуй день",
    text: "Щоденна сторінка бере задачі з шаблону і дає простір для реального дня: перетягування, таймер, виконання, нотатки й нагадування.",
    bullets: ["Підтягуй шаблон", "Запускай таймер", "Закривай виконані задачі"],
    icon: CalendarCheck,
    imageKey: "daily" as const,
  },
  {
    number: "03",
    title: "Дивись аналітику",
    text: "Аналітика показує, куди реально йде увага. Порівнюй план і факт, дивись прогрес по сферах і знаходь перекоси до того, як вони стануть проблемою.",
    bullets: ["План проти факту", "Баланс категорій", "Динаміка за період"],
    icon: BarChart3,
    imageKey: "analytics" as const,
  },
  {
    number: "04",
    title: "Налаштуй профіль",
    text: "У профілі зібрані ім'я, фото, мова, тема, звук, push-сповіщення і тариф. Це місце для особистих налаштувань без зайвого шуму.",
    bullets: ["Онови фото", "Перевір тариф", "Керуй мовою і темою"],
    icon: UserCircle,
    imageKey: "profile" as const,
  },
];

const principles = [
  "Починай з 3-5 регулярних задач, а не з ідеального плану на все життя.",
  "Щоденний план має бути живим: перенось, видаляй, уточнюй, коли день змінюється.",
  "Аналітика корисна не для самокритики, а для корекції фокусу на наступний тиждень.",
];

function GuideImageSlot({
  imageKey,
  title,
  eyebrow,
  imageUrl,
  isAdmin,
  onUpload,
  className,
}: GuideImageSlotProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(imageKey, file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative min-h-[240px] overflow-hidden rounded-[28px] border-2 border-zinc-950 bg-[#f7efdf] dark:border-white/85 dark:bg-zinc-950",
        className,
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full min-h-[240px] w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[240px] flex-col justify-between bg-[linear-gradient(90deg,rgba(24,24,27,0.08)_1px,transparent_1px),linear-gradient(rgba(24,24,27,0.08)_1px,transparent_1px)] bg-[size:32px_32px] p-5 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)]">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            <span>{eyebrow}</span>
            <span>Life Focus</span>
          </div>
          <div className="mx-auto flex h-28 w-28 rotate-[-8deg] items-center justify-center rounded-full border-2 border-zinc-950 bg-[#60d7bd] text-zinc-950 shadow-[8px_8px_0_#27215f] dark:border-white dark:bg-indigo-400 dark:text-zinc-950 dark:shadow-[8px_8px_0_#60d7bd]">
            <Sparkles className="h-10 w-10" />
          </div>
          <p className="max-w-xs text-3xl font-black uppercase leading-none tracking-normal text-zinc-950 dark:text-white">
            {title}
          </p>
        </div>
      )}

      {isAdmin && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-950 bg-white text-zinc-950 shadow-[3px_3px_0_#18181b] transition-transform hover:-translate-y-0.5 dark:border-white dark:bg-zinc-950 dark:text-white dark:shadow-[3px_3px_0_#60d7bd]"
            aria-label="Змінити зображення"
            title="Змінити зображення"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleChange}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}

export default function Documentation() {
  const { user } = useAuth();
  const [images, setImages] = useState<DocumentationImages>({});
  const [imagesLoading, setImagesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadDocumentationImages()
      .then((result) => {
        if (!cancelled) setImages(result);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Не вдалося завантажити зображення гайду.");
        }
      })
      .finally(() => {
        if (!cancelled) setImagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    fetchBillingMe(user)
      .then((billing) => {
        if (!cancelled) setIsAdmin(Boolean(billing.plan.adminAccess));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const uploadedCount = useMemo(
    () => DOCUMENTATION_IMAGE_KEYS.filter((key) => Boolean(images[key])).length,
    [images],
  );

  const handleUpload = async (key: DocumentationImageKey, file: File) => {
    try {
      const url = await uploadDocumentationImage(key, file);
      setImages((current) => ({ ...current, [key]: url }));
      toast.success("Зображення оновлено.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося оновити зображення.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
      <article className="overflow-hidden rounded-[32px] border border-zinc-200 bg-[#f8f0df] text-zinc-950 shadow-sm dark:border-white/15 dark:bg-zinc-950 dark:text-white">
        <header className="px-5 pt-5 md:px-10 md:pt-8">
          <div className="flex items-start justify-between gap-4 text-[10px] font-semibold uppercase tracking-wide">
            <div>
              <p>Документація</p>
              <p>Life Focus</p>
            </div>
            <p>Гайд 2026</p>
            <div className="text-right">
              <p>Task manager</p>
              <p>Balance system</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-end">
            <div>
              <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.9] tracking-normal md:text-7xl">
                Як працювати з фокусом
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
                Від першого шаблону до щоденного виконання й аналітики. Цей гайд
                допомагає налаштувати Life Focus так, щоб додаток підтримував
                реальний день, а не вимагав ідеального плану.
              </p>
            </div>

            <GuideImageSlot
              imageKey="hero"
              title="Start here"
              eyebrow="Основи"
              imageUrl={images.hero}
              isAdmin={isAdmin}
              onUpload={handleUpload}
              className="min-h-[300px]"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y-2 border-zinc-950 py-3 text-xs font-semibold uppercase dark:border-white/85">
            <span>Шаблони</span>
            <span>Щоденні задачі</span>
            <span>Таймер</span>
            <span>Нагадування</span>
            <span>Аналітика</span>
            <span>Профіль</span>
          </div>
        </header>

        <section className="grid gap-8 px-5 py-8 md:grid-cols-[280px_minmax(0,1fr)] md:px-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase leading-none tracking-normal">
              Hello!
            </h2>
            <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Life Focus побудований навколо простого циклу: один раз задаєш
              регулярний ритм, щодня працюєш із фактом, а потім дивишся, де увага
              дала результат.
            </p>
            <div className="flex flex-wrap gap-2">
              {["План", "Фокус", "Баланс"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border-2 border-zinc-950 px-3 py-1 text-xs font-black uppercase dark:border-white/85"
                >
                  {tag}
                </span>
              ))}
            </div>
            {isAdmin && (
              <p className="rounded-2xl border-2 border-zinc-950 bg-white px-4 py-3 text-xs font-semibold shadow-[4px_4px_0_#18181b] dark:border-white/85 dark:bg-white/[0.06] dark:shadow-[4px_4px_0_#60d7bd]">
                Admin mode: зображення можна змінювати кнопкою камери. Завантажено:
                {" "}{uploadedCount}/{DOCUMENTATION_IMAGE_KEYS.length}.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {principles.map((principle, index) => (
              <div
                key={principle}
                className="rounded-[22px] border-2 border-zinc-950 bg-white p-4 shadow-[5px_5px_0_#18181b] dark:border-white/85 dark:bg-white/[0.06] dark:shadow-[5px_5px_0_#60d7bd]"
              >
                <p className="text-3xl font-black">0{index + 1}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{principle}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-10 border-t-2 border-zinc-950 px-5 py-8 dark:border-white/85 md:px-10">
          {guideSteps.map((step, index) => {
            const Icon = step.icon;
            const reversed = index % 2 === 1;

            return (
              <div
                key={step.number}
                className={cn(
                  "grid gap-6 md:grid-cols-2 md:items-center",
                  reversed && "md:[&>*:first-child]:order-2",
                )}
              >
                <GuideImageSlot
                  imageKey={step.imageKey}
                  title={step.title}
                  eyebrow={`Крок ${step.number}`}
                  imageUrl={images[step.imageKey]}
                  isAdmin={isAdmin}
                  onUpload={handleUpload}
                />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-950 bg-[#27215f] text-white dark:border-white dark:bg-indigo-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-wide">
                      {step.number}
                    </p>
                  </div>
                  <h2 className="text-4xl font-black uppercase leading-none tracking-normal">
                    {step.title}
                  </h2>
                  <p className="max-w-xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {step.text}
                  </p>
                  <div className="grid gap-2">
                    {step.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-[#189b83]" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="border-t-2 border-zinc-950 px-5 py-8 dark:border-white/85 md:px-10">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
            <div>
              <h2 className="text-4xl font-black uppercase leading-none tracking-normal">
                Швидкий старт
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Якщо відкриваєш додаток уперше, почни з шаблону. Якщо шаблон уже
                є — переходь до сьогоднішнього дня і працюй із задачами там.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild className="bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                <Link to={ROUTES.TEMPLATE}>
                  <LayoutDashboard />
                  Створити шаблон
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-zinc-950 bg-transparent dark:border-white/85 dark:text-white dark:hover:bg-white/10">
                <Link to={getTodayDailyRoute()}>
                  <CalendarCheck />
                  Перейти до сьогодні
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </article>

      {imagesLoading && (
        <div className="fixed bottom-4 right-4 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 shadow-lg dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
          Завантаження гайду...
        </div>
      )}
    </div>
  );
}
