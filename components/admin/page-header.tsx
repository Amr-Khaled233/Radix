import type { ReactNode } from "react";

type PageHeaderProps = {
  label?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ label, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {label ? <p className="type-label text-label">{label}</p> : null}
        <h1 className="type-h3 text-foreground mt-1">{title}</h1>
        {description ? <div className="type-body text-muted mt-2 max-w-2xl">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
