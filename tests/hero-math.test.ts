import { describe, expect, it } from "vitest";
import {
  beatState,
  frameLoadOrder,
  frameName,
  placeMedia,
  progressToFrame,
  progressToTime,
  smoothStep,
} from "@/lib/hero/math";

describe("hero math", () => {
  it("maps scroll progress into the trimmed range", () => {
    expect(progressToTime(0, { start: 1, end: 9 }, 10)).toBe(1);
    expect(progressToTime(0.5, { start: 1, end: 9 }, 10)).toBe(5);
    expect(progressToTime(1, { start: 1, end: null }, 10)).toBe(10);
    expect(progressToTime(2, { start: 0, end: 4 }, 10)).toBe(4);
    expect(progressToTime(0.5, { start: 8, end: 2 }, 10)).toBe(8); // end before start → no range
  });

  it("maps progress to frame indexes", () => {
    expect(progressToFrame(0, 120)).toBe(0);
    expect(progressToFrame(1, 120)).toBe(119);
    expect(progressToFrame(0.5, 121)).toBe(60);
  });

  it("smooths toward the target and snaps when close", () => {
    expect(smoothStep(0, 1, 0)).toBe(1);
    const step = smoothStep(0, 1, 0.8);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(1);
    expect(smoothStep(0.9999, 1, 0.5)).toBe(1);
  });

  it("fades beats in and out over their range", () => {
    const beat = { from: 20, to: 60 };
    expect(beatState(beat, 10).opacity).toBe(0);
    expect(beatState(beat, 40)).toEqual({ opacity: 1, offset: 0 });
    expect(beatState(beat, 21).opacity).toBeGreaterThan(0);
    expect(beatState(beat, 21).opacity).toBeLessThan(1);
    expect(beatState(beat, 59).offset).toBeLessThan(0);
    expect(beatState(beat, 61).opacity).toBe(0);
  });

  it("loads frames coarse-to-fine starting with the first", () => {
    const order = frameLoadOrder(20);
    expect(order[0]).toBe(0);
    expect(order.slice(1, 3)).toEqual([8, 16]);
    expect(new Set(order).size).toBe(20);
    expect([...order].sort((a, b) => a - b)).toEqual([...Array(20).keys()]);
  });

  it("names frames with four digits", () => {
    expect(frameName(0)).toBe("0001.webp");
    expect(frameName(119)).toBe("0120.webp");
  });

  it("places cover media around the focal point without exposing edges", () => {
    const placed = placeMedia({ width: 1920, height: 1080 }, { width: 390, height: 844 }, "cover", { x: 1, y: 0.5 });
    expect(placed.height).toBeCloseTo(844);
    expect(placed.x).toBeCloseTo(390 - placed.width); // focal at the right edge
    expect(placed.x + placed.width).toBeCloseTo(390);
    const contained = placeMedia({ width: 1920, height: 1080 }, { width: 1000, height: 1000 }, "contain", {
      x: 0.5,
      y: 0.5,
    });
    expect(contained.width).toBeCloseTo(1000);
    expect(contained.y).toBeGreaterThan(0);
  });
});
