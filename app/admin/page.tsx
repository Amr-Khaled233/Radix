import { getTranslations } from "next-intl/server";
import { AdminLocaleToggle } from "@/components/admin/admin-locale-toggle";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getAdminLocale } from "@/lib/admin/locale";
import { requireAdminPage } from "@/lib/auth/session";

/** Phase 2 placeholder: proves the protected area works. Phase 3 replaces it with the dashboard. */
export default async function AdminHomePage() {
  const user = await requireAdminPage();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin" });

  return (
    <div className="container-site py-fib-34">
      <div className="flex items-center justify-between gap-4">
        <div className="text-foreground">
          <Logo variant="icon" height={32} clearSpace={false} />
        </div>
        <div className="flex items-center gap-2">
          <AdminLocaleToggle />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
      <div className="bg-line-strong full-bleed mt-fib-21 h-0.5" aria-hidden />
      <section className="py-fib-55">
        <p className="type-label text-label">{t("home.label")}</p>
        <h1 className="type-h2 text-foreground mt-fib-13">{t("home.welcome", { name: user.name })}</h1>
        <p className="type-body text-muted mt-fib-13">{t("home.role", { role: t(`roles.${user.role}`) })}</p>
        <p className="type-body text-muted mt-fib-21">{t("home.placeholder")}</p>
      </section>
    </div>
  );
}
