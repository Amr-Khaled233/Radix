import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CoreNode = {
  /** Depth of the node below the surface line, in px. */
  depth: number;
  content?: ReactNode;
};

type CoreLinesProps = {
  nodes: CoreNode[];
  /** Grid columns on wide screens; nodes stack in one column on mobile. */
  columns?: 2 | 3 | 4;
  className?: string;
};

const COLUMNS = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
} as const;

/**
 * C. Core lines — vertical violet lines descending from the surface line,
 * each ending in a 12 px square node, connecting a headline to supporting
 * detail. Lines anchor at inline-start of each column (mirrors in RTL).
 * Sits on the page ground, never on Graphite surfaces.
 */
export function CoreLines({ nodes, columns = 4, className }: CoreLinesProps) {
  return (
    <ol className={cn("grid grid-cols-1 gap-x-fib-34", COLUMNS[columns], className)}>
      {nodes.map((node, i) => (
        <li key={i} className="relative" style={{ ["--stagger" as string]: `${i * 80}ms` }}>
          <div aria-hidden className="flex flex-col items-start">
            <span className="reveal-core bg-accent ms-[5px] block w-px" style={{ height: node.depth }} />
            <span className="reveal-settle bg-accent block size-3" />
          </div>
          {node.content ? <div className="reveal-settle pt-fib-13 pb-fib-34">{node.content}</div> : null}
        </li>
      ))}
    </ol>
  );
}
