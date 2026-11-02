"use client";

import { useTranslations } from "next-intl";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Translation key under admin.validation (from the shared zod schemas). */
  error?: string;
  errorValues?: Record<string, string | number>;
  hint?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, errorValues, hint, className, id, ...props },
  ref,
) {
  const t = useTranslations("admin.validation");
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="type-button text-foreground block">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(
          "bg-background text-foreground rounded-input type-body block min-h-12 w-full border px-3 py-2",
          "placeholder:text-muted outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
          error ? "border-foreground border-2" : "border-line-strong",
        )}
        {...props}
      />
      {hint ? (
        <div id={hintId} className="type-body text-muted text-sm">
          {hint}
        </div>
      ) : null}
      {error ? (
        <p id={errorId} className="type-body text-foreground text-sm font-semibold">
          {t(error as Parameters<typeof t>[0], errorValues)}
        </p>
      ) : null}
    </div>
  );
});

export function SubmitButton({
  children,
  pending,
  pendingLabel,
}: {
  children: ReactNode;
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="type-button bg-accent text-on-accent hover:bg-inverse hover:text-on-inverse inline-flex min-h-12 w-full items-center justify-center px-6 transition-colors duration-(--duration-hover) disabled:opacity-70"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Status message box; `role="alert"` for errors so screen readers announce them. */
export function FormMessage({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "type-body border-s-2 px-4 py-3 text-sm",
        tone === "error"
          ? "border-foreground bg-background text-foreground font-semibold"
          : "border-accent bg-background text-foreground",
      )}
    >
      {children}
    </div>
  );
}
