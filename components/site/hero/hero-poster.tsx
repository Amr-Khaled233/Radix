import { getImageProps } from "next/image";
import type { MediaRef } from "@/lib/site/data";

/**
 * Art-directed poster (desktop ≥ 768 px, mobile below) rendered on the server
 * with high fetch priority — the hero's LCP element. Decorative: meaning lives
 * in the text beats.
 */
export function HeroPoster({
  desktop,
  mobile,
  fit,
  focal,
}: {
  desktop: MediaRef | null;
  mobile: MediaRef | null;
  fit: "cover" | "contain";
  focal: { desktop: { x: number; y: number }; mobile: { x: number; y: number } };
}) {
  const primary = desktop ?? mobile;
  if (!primary) return null;
  const common = { alt: "", sizes: "100vw", priority: true, quality: 80 } as const;
  const props = (image: MediaRef) =>
    getImageProps({ ...common, src: image.url, width: image.width ?? 1920, height: image.height ?? 1080 }).props;
  const desktopProps = props(primary);
  const mobileProps = mobile ? props(mobile) : null;
  const objectFit = fit === "cover" ? "cover" : "contain";

  return (
    <picture>
      {mobileProps ? <source media="(max-width: 767px)" srcSet={mobileProps.srcSet} sizes="100vw" /> : null}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        {...desktopProps}
        aria-hidden
        data-hero-poster=""
        className="absolute inset-0 size-full"
        style={{
          objectFit,
          objectPosition: `var(--hero-focal, ${focal.desktop.x * 100}% ${focal.desktop.y * 100}%)`,
        }}
      />
    </picture>
  );
}
