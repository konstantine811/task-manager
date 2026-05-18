type PaymentCardLogosProps = {
  className?: string;
};

export function PaymentCardLogos({ className = "" }: PaymentCardLogosProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      aria-label="Доступна оплата картками Visa та Mastercard"
    >
      <span className="inline-flex h-9 w-16 items-center justify-center rounded-md border border-zinc-200 bg-white px-2 shadow-sm dark:border-white/10">
        <svg viewBox="0 0 64 24" className="h-5 w-12" aria-label="Visa" role="img">
          <path
            fill="#1434CB"
            d="M25.8 17.2h-4.1l2.6-10.4h4.1l-2.6 10.4Zm13-10.1a10.1 10.1 0 0 0-3.7-.7c-4.1 0-7 2.1-7 5.2 0 2.3 2.1 3.5 3.6 4.2 1.6.8 2.1 1.3 2.1 2 0 1.1-1.3 1.6-2.5 1.6-1.7 0-2.6-.2-4-.8l-.6-.3-.6 3.5c1 .4 2.8.8 4.6.8 4.4 0 7.2-2.1 7.2-5.4 0-1.8-1.1-3.1-3.5-4.2-1.4-.7-2.3-1.1-2.3-1.8 0-.6.7-1.3 2.2-1.3 1.4 0 2.4.3 3.2.6l.4.2.6-3.4Zm10.6-.3h-3.2c-1 0-1.8.3-2.2 1.3l-6.1 14.4h4.3l.9-2.3h5.2l.5 2.3h3.8L49.4 6.8Zm-5.1 10.2 1.7-4.5.6-1.7.3 1.5 1 4.7h-3.6ZM18.3 6.8l-4 7.1-.4-2c-.7-2.4-3-5-5.5-6.3l3.7 16.8h4.4l6.4-15.6h-4.6Z"
          />
          <path fill="#F7B600" d="M10.8 6.8H4.1L4 7.1c5.2 1.3 8.6 4.5 9.9 8.3l-1.4-7.3c-.2-1-.9-1.3-1.7-1.3Z" />
        </svg>
      </span>
      <span className="inline-flex h-9 w-16 items-center justify-center rounded-md border border-zinc-200 bg-white px-2 shadow-sm dark:border-white/10">
        <svg viewBox="0 0 64 24" className="h-6 w-12" aria-label="Mastercard" role="img">
          <circle cx="25" cy="12" r="9" fill="#EB001B" />
          <circle cx="39" cy="12" r="9" fill="#F79E1B" />
          <path
            fill="#FF5F00"
            d="M32 5.1a9 9 0 0 0 0 13.8 9 9 0 0 0 0-13.8Z"
          />
        </svg>
      </span>
    </div>
  );
}
