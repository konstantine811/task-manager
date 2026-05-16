import { Link, useSearchParams } from "react-router";
import { CheckCircle2, CircleX, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

const getPaymentState = (value: string | null) => {
  const normalized = value?.toLowerCase();
  if (normalized === "success" || normalized === "paid" || normalized === "approved") {
    return "success";
  }
  if (normalized === "failure" || normalized === "failed" || normalized === "declined") {
    return "failed";
  }
  return "pending";
};

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const state = getPaymentState(searchParams.get("status") || searchParams.get("result"));

  const content = {
    success: {
      icon: CheckCircle2,
      title: "Оплату підтверджено",
      text: "Доступ активується автоматично після синхронізації платежу. Онови тариф, якщо статус ще не змінився.",
      className: "text-emerald-500",
    },
    failed: {
      icon: CircleX,
      title: "Оплату не завершено",
      text: "Платіж було відхилено або скасовано. Можна повернутися до тарифів і спробувати ще раз.",
      className: "text-red-500",
    },
    pending: {
      icon: Clock,
      title: "Статус платежу уточнюється",
      text: "Ми очікуємо підтвердження від платіжного провайдера. Зазвичай це займає кілька хвилин.",
      className: "text-amber-500",
    },
  }[state];

  const Icon = content.icon;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-zinc-900 dark:bg-black dark:text-white">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-white/10 dark:bg-white/[0.04]">
        <Icon className={`mx-auto h-12 w-12 ${content.className}`} />
        <h1 className="mt-5 text-2xl font-semibold">{content.title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {content.text}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to={ROUTES.BILLING}>
              <RefreshCw />
              Перевірити тариф
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.HOME}>На головну</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
