import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { AdminLocaleToggle } from "./admin-locale-toggle";

type AuthShellProps = {
  label: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
};

/** Layout for signed-out dashboard pages (login, forgot, reset). */
export function AuthShell({ label, title, intro, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="container-site flex h-16 items-center justify-end gap-2">
        <AdminLocaleToggle />
        <ThemeToggle />
      </div>
      <main className="container-site flex flex-1 items-start justify-center pt-fib-34 pb-fib-89 sm:items-center sm:pt-0">
        <div className="w-full max-w-[440px]">
          <div className="text-foreground mb-fib-34">
            <Logo variant="horizontal" height={74} clearSpace={false} />
          </div>
          <div className="bg-surface border-line border p-fib-34">
            <p className="type-label text-label">{label}</p>
            <h1 className="type-h3 text-foreground mt-2">{title}</h1>
            {intro ? <div className="type-body text-muted mt-fib-13">{intro}</div> : null}
            <div className="mt-fib-21">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
