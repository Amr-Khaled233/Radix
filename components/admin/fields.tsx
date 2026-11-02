"use client";

import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

type FieldShellProps = {
  label: string;
  hint?: ReactNode;
  error?: string | string[];
  optional?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
};

/** Label + control + hint + error, wired for screen readers. */
export function Field({ label, hint, error, optional, children, className }: FieldShellProps) {
  const t = useTranslations("admin.fields");
  const id = useId();
  const message = Array.isArray(error) ? error[0] : error;
  const describedBy = cn(hint && `${id}-hint`, message && `${id}-error`) || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-foreground block text-sm font-semibold">
        {label}
        {optional ? <span className="text-muted ms-2 font-normal">({t("optional")})</span> : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(message) })}
      {hint ? (
        <p id={`${id}-hint`} className="text-muted text-sm">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={`${id}-error`} className="text-danger text-sm font-semibold">
          {message}
        </p>
      ) : null}
    </div>
  );
}

type TextProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string | string[];
  optional?: boolean;
};

export function TextInput({ label, hint, error, optional, className, ...props }: TextProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <Input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} {...props} />
      )}
    </Field>
  );
}

type AreaProps = Omit<React.ComponentProps<typeof Textarea>, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string | string[];
  optional?: boolean;
};

export function TextArea({ label, hint, error, optional, className, ...props }: AreaProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <Textarea id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} {...props} />
      )}
    </Field>
  );
}

type ToggleProps = {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Toggle({ label, hint, checked, disabled, onCheckedChange }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="text-sm">
        <span className="text-foreground block font-semibold">{label}</span>
        {hint ? <span className="text-muted block">{hint}</span> : null}
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/** Groups form controls in a titled panel. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface border-line border p-5 sm:p-6">
      <h2 className="type-h4 text-foreground">{title}</h2>
      {description ? <div className="text-muted mt-1 text-sm">{description}</div> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
