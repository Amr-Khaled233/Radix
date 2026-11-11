import { Icon } from "@/components/brand/icon";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import type { MediaRef, PublicTeamCard } from "@/lib/site/data";
import { localizeDigits } from "@/lib/site/digits";
import { SiteImage } from "./site-image";

type ProjectCardData = {
  slug: string;
  title: { en: string; ar: string };
  clientName: { en: string; ar: string };
  year: number | null;
  cover: MediaRef | null;
};

/** `href` is the case study under a pillar (lib/site/paths.ts → projectPath). */
export function ProjectCard({
  project,
  href,
  locale,
  categoryNames = [],
  digits,
  priority,
}: {
  project: ProjectCardData;
  href: string;
  locale: Locale;
  categoryNames?: string[];
  digits: "western" | "arabic-indic";
  priority?: boolean;
}) {
  const client = t(project.clientName, locale);
  return (
    <div className="frame-slot">
      <Link href={href} className="frame-card group block p-fib-13">
        <div className="bg-inverse relative aspect-[16/10] overflow-hidden">
          {project.cover ? (
            <SiteImage
              image={project.cover}
              locale={locale}
              priority={priority}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="transition-transform duration-700 ease-brand group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
            />
          ) : null}
        </div>
        <div className="border-line mt-fib-13 flex items-start justify-between gap-4 border-t pt-fib-13">
          <div className="min-w-0">
            <h3 className="type-h4 text-foreground group-hover:text-focus transition-colors">
              {t(project.title, locale)}
            </h3>
            <p className="text-muted mt-1 text-sm">{[client, ...categoryNames].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {project.year ? (
              <span className="type-data text-muted">
                <bdi>{localizeDigits(project.year, locale, digits)}</bdi>
              </span>
            ) : null}
            <span className="text-foreground group-hover:text-focus transition-transform duration-(--duration-hover) ease-brand group-hover:-translate-y-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 motion-reduce:transform-none">
              <Icon name="arrow-up-right" size={20} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function TeamCard({ member, locale }: { member: PublicTeamCard; locale: Locale }) {
  return (
    <div className="frame-slot">
      <Link href={`/team/${member.slug}`} className="frame-card group block p-fib-13">
        <div className="bg-inverse relative aspect-square overflow-hidden">
          {member.photo ? (
            <SiteImage
              image={member.photo}
              locale={locale}
              sizes="(min-width: 1024px) 25vw, 50vw"
              decorative
              className="transition-transform duration-700 ease-brand group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
            />
          ) : null}
        </div>
        <h3 className="type-h4 text-foreground group-hover:text-focus mt-fib-13 transition-colors">
          {t(member.name, locale)}
        </h3>
        <p className="type-label text-label mt-1">{t(member.role, locale)}</p>
        {t(member.shortBio, locale) ? (
          <p className="type-body text-muted mt-2 line-clamp-3">{t(member.shortBio, locale)}</p>
        ) : null}
      </Link>
    </div>
  );
}
