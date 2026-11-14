import { cn } from "@/lib/cn";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

/** Language and theme as one joined pair of framed buttons: [AR | LIGHT]. Used in the header and the phone menu. */
export function SiteControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <LocaleSwitcher />
      {/* Shares the border with the language button instead of doubling it. */}
      <ThemeToggle className="-ms-px" />
    </div>
  );
}
