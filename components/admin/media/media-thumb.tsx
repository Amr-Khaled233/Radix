import { Film } from "lucide-react";
import { cn } from "@/lib/cn";
import { uiIcon } from "../ui-icon";

export type MediaLike = {
  id: string;
  kind: "image" | "video";
  url: string;
  alt?: { en: string; ar: string };
};

/** Square preview for dashboard grids. Plain <img>/<video>: the dashboard needs no optimisation. */
export function MediaThumb({
  item,
  className,
  fit = "cover",
}: {
  item: MediaLike;
  className?: string;
  fit?: "cover" | "contain";
}) {
  if (item.kind === "video") {
    return (
      <div className={cn("bg-inverse text-on-inverse relative overflow-hidden", className)}>
        <video src={item.url} muted preload="metadata" playsInline className="size-full object-cover" aria-hidden />
        <Film {...uiIcon} size={16} className="absolute inset-s-2 top-2" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={item.alt?.en ?? ""}
      loading="lazy"
      className={cn("bg-background block", fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
