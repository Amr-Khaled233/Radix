"use client";

import { useId } from "react";
import { Icon, ICON_NAMES, type IconName } from "@/components/brand/icon";
import { cn } from "@/lib/cn";

/** Picks a category icon from the brand icon set (pillar icons first). */
export function IconPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (name: IconName) => void;
}) {
  const groupId = useId();
  const pillars: IconName[] = ["brand", "digital", "intelligence", "growth"];
  const ordered = [...pillars, ...ICON_NAMES.filter((name) => !pillars.includes(name))];
  return (
    <fieldset className="space-y-2">
      <legend id={groupId} className="text-foreground text-sm font-semibold">
        {label}
      </legend>
      <div role="radiogroup" aria-labelledby={groupId} className="grid grid-cols-6 gap-1 sm:grid-cols-12">
        {ordered.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={name}
            title={name}
            onClick={() => onChange(name)}
            className={cn(
              "border-line inline-flex aspect-square items-center justify-center border",
              value === name ? "bg-inverse text-on-inverse border-inverse" : "text-foreground hover:border-line-strong",
            )}
          >
            <Icon name={name} size={20} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
