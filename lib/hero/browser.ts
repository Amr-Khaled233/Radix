"use client";

import { contrastRatio, hexToRgb, mixRgb, type Rgb } from "@/lib/contrast";
import { uploadFile } from "@/lib/media/upload-client";
import { frameName } from "./math";

function once(target: EventTarget, event: string) {
  return new Promise<void>((resolve, reject) => {
    const ok = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error(`${event} failed`));
    };
    const cleanup = () => {
      target.removeEventListener(event, ok);
      target.removeEventListener("error", fail);
    };
    target.addEventListener(event, ok, { once: true });
    target.addEventListener("error", fail, { once: true });
  });
}

/** A muted, CORS-enabled video element ready to seek. */
export async function loadVideo(url: string) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  await once(video, "loadeddata");
  return video;
}

async function seek(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < 0.0005) return;
  const done = once(video, "seeked");
  video.currentTime = time;
  await done;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob && blob.type === type ? resolve(blob) : reject(new Error("encode"))), type, quality),
  );
}

export function supportsWebpEncoding() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

type GenerateOptions = {
  videoUrl: string;
  sequenceId: string;
  fps: number;
  width: number;
  quality: number;
  trim: { start: number; end: number | null };
  onProgress: (phase: "encode" | "upload", done: number, total: number) => void;
  signal?: AbortSignal;
};

/**
 * Converts a video into a WebP frame sequence in the browser and uploads it to
 * hero/frames/{sequenceId}/0001.webp… Frames are encoded sequentially (seek →
 * draw → encode) and uploaded four at a time.
 */
export async function generateFrameSequence(options: GenerateOptions) {
  const { videoUrl, sequenceId, fps, width, quality, trim, onProgress, signal } = options;
  if (!supportsWebpEncoding()) throw new Error("webp");
  const video = await loadVideo(videoUrl);
  const start = Math.max(0, trim.start);
  const end = Math.min(video.duration, trim.end ?? video.duration);
  const total = Math.max(2, Math.floor((end - start) * fps));
  const height = Math.round((width * video.videoHeight) / video.videoWidth / 2) * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  const uploads: Promise<string>[] = [];
  let uploaded = 0;
  let running = 0;
  const queue: (() => void)[] = [];
  const limit = async <T>(task: () => Promise<T>) => {
    if (running >= 4) await new Promise<void>((resolve) => queue.push(resolve));
    running++;
    try {
      return await task();
    } finally {
      running--;
      queue.shift()?.();
    }
  };

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) throw new Error("aborted");
    await seek(video, Math.min(end, start + i / fps));
    ctx.drawImage(video, 0, 0, width, height);
    const blob = await toBlob(canvas, "image/webp", quality);
    onProgress("encode", i + 1, total);
    const pathname = `hero/frames/${sequenceId}/${frameName(i)}`;
    uploads.push(
      limit(async () => {
        const result = await uploadFile(blob, { kind: "frame", pathname });
        onProgress("upload", ++uploaded, total);
        return result.url;
      }),
    );
  }
  const urls = await Promise.all(uploads);
  const first = urls[0];
  return { frameCount: total, width, height, baseUrl: first.slice(0, first.lastIndexOf("/") + 1) };
}

/** Captures the current frame of a playing/previewed video as a WebP blob. */
export async function captureFrame(video: HTMLVideoElement, maxWidth = 1920) {
  const width = Math.min(maxWidth, video.videoWidth);
  const height = Math.round((width * video.videoHeight) / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(video, 0, 0, width, height);
  return { blob: await toBlob(canvas, "image/webp", 0.9), width, height };
}

const AUBERGINE = hexToRgb("#1B1028");
const IVORY = hexToRgb("#F6F3EE");

/** Brightest-10% colour of an image (a conservative background for contrast checks). */
export async function brightColorOf(url: string): Promise<Rgb | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const pixels: Rgb[] = [];
    for (let i = 0; i < data.length; i += 4) pixels.push([data[i], data[i + 1], data[i + 2]]);
    pixels.sort(
      (a, b) => a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722 - (b[0] * 0.2126 + b[1] * 0.7152 + b[2] * 0.0722),
    );
    return pixels[Math.floor(pixels.length * 0.9)];
  } catch {
    return null;
  }
}

/** Ivory text over the image under an Aubergine overlay of `opacity` (0–80%). */
export function heroTextContrast(bright: Rgb | null, opacityPercent: number) {
  const background = mixRgb(AUBERGINE, bright ?? AUBERGINE, opacityPercent / 100);
  return contrastRatio(IVORY, background);
}
