import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/brand/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/cn";

type LinkProps = ComponentProps<typeof Link>;

/** Primary (violet) and secondary (outlined) calls to action — square, 48 px tall. */
export function CtaLink({
  variant = "primary",
  arrow = variant === "primary",
  className,
  children,
  ...props
}: LinkProps & { variant?: "primary" | "secondary" | "inverse"; arrow?: boolean }) {
  return (
    <Link
      {...props}
      className={cn(
        "type-button inline-flex min-h-12 items-center gap-2 px-6 transition-colors duration-(--duration-hover) ease-brand",
        variant === "primary" && "bg-accent text-on-accent hover:bg-inverse hover:text-on-inverse",
        variant === "secondary" &&
          "border-line-strong text-foreground hover:bg-foreground hover:text-background border",
        variant === "inverse" && "bg-on-inverse text-inverse hover:bg-accent hover:text-on-accent",
        className,
      )}
    >
      {children}
      {arrow ? <Icon name="arrow-right" size={18} /> : null}
    </Link>
  );
}

/** Mono label + heading used at the top of sections. */
export function SectionHeading({
  label,
  heading,
  as: Tag = "h2",
  size = "h2",
  className,
  children,
}: {
  label?: ReactNode;
  heading?: ReactNode;
  as?: "h1" | "h2";
  size?: "h1" | "h2" | "display";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className}>
      {label ? <p className="type-label text-label reveal-rise">{label}</p> : null}
      {heading ? (
        <Tag
          className={cn(
            "text-foreground mt-fib-13 max-w-4xl text-balance",
            // A page's h1 is its LCP element: it lifts in without being hidden first.
            Tag === "h1" ? "reveal-lift" : "reveal-rise",
            size === "display" ? "type-display" : size === "h1" ? "type-h1" : "type-h2",
          )}
        >
          {heading}
        </Tag>
      ) : null}
      {children}
    </div>
  );
}
