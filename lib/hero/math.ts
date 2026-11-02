/**
 * Pure helpers shared by the scroll-driven hero (public site) and the
 * dashboard preview. No DOM access, so they are unit-tested.
 */

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Maps scroll progress (0–1) to a video time within the trimmed range. */
export function progressToTime(progress: number, trim: { start: number; end: number | null }, duration: number) {
  const start = clamp(trim.start, 0, duration);
  const end = clamp(trim.end ?? duration, start, duration);
  return start + clamp(progress) * (end - start);
}

/** Frame index for frame-sequence mode. */
export function progressToFrame(progress: number, frameCount: number) {
  return Math.min(frameCount - 1, Math.max(0, Math.round(clamp(progress) * (frameCount - 1))));
}

/** One step of exponential smoothing toward the target (smoothing 0 = jump, 1 = very smooth). */
export function smoothStep(current: number, target: number, smoothing: number) {
  const factor = 1 - clamp(smoothing, 0, 0.98);
  const next = current + (target - current) * factor;
  return Math.abs(target - next) < 0.0005 ? target : next;
}

/**
 * Visibility of a text beat at a progress (0–100 ranges): fades/rises in over
 * the first 15% of its range and out over the last 15% (no fade-in at 0%, no
 * fade-out at 100%). Returns opacity 0–1
 * and a vertical offset in px (24 → 0 → -24).
 */
export function beatState(beat: { from: number; to: number }, progressPercent: number) {
  const { from, to } = beat;
  if (to <= from || progressPercent < from || progressPercent > to) return { opacity: 0, offset: 24 };
  const span = to - from;
  const edge = Math.max(span * 0.15, 0.5);
  // Beats that start at 0% are visible on load; beats that end at 100% stay until the end.
  if (from > 0 && progressPercent < from + edge) {
    const p = (progressPercent - from) / edge;
    return { opacity: p, offset: 24 * (1 - p) };
  }
  if (to < 100 && progressPercent > to - edge) {
    const p = (to - progressPercent) / edge;
    return { opacity: p, offset: -24 * (1 - p) };
  }
  return { opacity: 1, offset: 0 };
}

/** Frame file name inside a sequence base path: 0001.webp … */
export function frameName(index: number, format = "webp") {
  return `${String(index + 1).padStart(4, "0")}.${format}`;
}

/**
 * Load order for frame sequences: first frame, then every 8th, then every
 * 4th, every 2nd, then the rest — scrubbing works before everything loads.
 */
export function frameLoadOrder(frameCount: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (i >= 0 && i < frameCount && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  for (const step of [8, 4, 2, 1]) for (let i = 0; i < frameCount; i += step) push(i);
  push(frameCount - 1);
  return order;
}

/** Cover/contain placement of a media box inside a viewport, honouring a focal point (0–1). */
export function placeMedia(
  media: { width: number; height: number },
  view: { width: number; height: number },
  fit: "cover" | "contain",
  focal: { x: number; y: number },
) {
  const scale =
    fit === "cover"
      ? Math.max(view.width / media.width, view.height / media.height)
      : Math.min(view.width / media.width, view.height / media.height);
  const width = media.width * scale;
  const height = media.height * scale;
  const x = fit === "cover" ? clamp(view.width / 2 - focal.x * width, view.width - width, 0) : (view.width - width) / 2;
  const y =
    fit === "cover" ? clamp(view.height / 2 - focal.y * height, view.height - height, 0) : (view.height - height) / 2;
  return { x, y, width, height };
}
