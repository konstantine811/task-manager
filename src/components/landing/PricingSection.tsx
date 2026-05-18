import { Check, HeartHandshake } from "lucide-react";
import { pricingPlans } from "@/config/legal";

const paymentMethods = ["IBAN", "Mono/Privat", "Wise", "Manual Pro"];

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-white">
            Безкоштовно зараз, Pro після підтримки
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Life Focus можна використовувати без обов'язкової оплати. Платні ліміти
            активуються вручну після донату або переказу, поки автоматичний платіжний
            шлюз недоступний.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <HeartHandshake className="h-4 w-4" />
          Pay later / manual activation
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <article
            key={plan.id}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{plan.name}</h3>
            <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">
              {plan.price}
            </p>
            <p className="mt-1 text-sm text-zinc-500">за {plan.period}</p>
            <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {plan.description}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {paymentMethods.map((method) => (
          <span
            key={method}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
          >
            {method}
          </span>
        ))}
      </div>
    </section>
  );
}
