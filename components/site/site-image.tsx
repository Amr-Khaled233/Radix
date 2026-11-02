import Image from "next/image";
import type { Locale } from "@/lib/i18n/routing";
import type { MediaRef } from "@/lib/site/data";
import { t } from "@/lib/localized";
import { cn } from "@/lib/cn";

type SiteImageProps = {
  image: MediaRef;
  locale: Locale;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Fill the parent box (parent must be positioned with a size). */
  fill?: boolean;
  /** Decorative images get an empty alt. */
  decorative?: boolean;
};

/** next/image for uploaded media (Vercel Blob or local dev storage), alt text per locale. */
export function SiteImage({ image, locale, sizes, className, priority, fill = true, decorative }: SiteImageProps) {
  const alt = decorative ? "" : t(image.alt, locale);
  if (fill || !image.width || !image.height) {
    return (
      <Image
        src={image.url}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }
  return (
    <Image
      src={image.url}
      alt={alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
