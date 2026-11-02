import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedPathname } from "@/lib/media/config";
import { isOwnUploadUrl, localFilePath } from "@/lib/media/storage";
import { safeReturnPath } from "@/lib/safe-redirect";

const ORIGIN = "https://radix.example";

describe("safeReturnPath (open-redirect guard)", () => {
  it.each(["/en/work", "/ar/work?category=brand", "/en#contact"])("keeps same-origin path %s", (to) => {
    expect(safeReturnPath(to, ORIGIN)).toBe(to);
  });

  it.each([
    null,
    "",
    "en",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
  ])("falls back to / for %j", (to) => {
    expect(safeReturnPath(to, ORIGIN)).toBe("/");
  });
});

describe("media paths", () => {
  it("rejects traversal and foreign prefixes", () => {
    expect(isAllowedPathname("media/photo.png", "image")).toBe(true);
    expect(isAllowedPathname("hero/frames/abc/0001.webp", "frame")).toBe(true);
    expect(isAllowedPathname("media/../secrets.png", "image")).toBe(false);
    expect(isAllowedPathname("hero/frames/x/0001.webp", "image")).toBe(false);
    expect(isAllowedPathname("media/x.png", "frame")).toBe(false);
    expect(isAllowedPathname("/etc/passwd", "image")).toBe(false);
  });

  it("keeps local files inside the upload folder", () => {
    expect(localFilePath("media/a.png")).not.toBeNull();
    expect(localFilePath("../package.json")).toBeNull();
    expect(localFilePath("media/../../.env.local")).toBeNull();
  });
});

describe("isOwnUploadUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts only this project's Blob store when the token is known", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_AbC123_secret");
    expect(isOwnUploadUrl("https://abc123.public.blob.vercel-storage.com/media/a.png")).toBe(true);
    expect(isOwnUploadUrl("https://other.public.blob.vercel-storage.com/media/a.png")).toBe(false);
    expect(isOwnUploadUrl("http://abc123.public.blob.vercel-storage.com/media/a.png")).toBe(false);
    expect(isOwnUploadUrl("https://evil.example/media/a.png")).toBe(false);
    // Local storage URLs are refused while Blob is the active storage.
    expect(isOwnUploadUrl("/api/media/local/media/a.png")).toBe(false);
  });

  it("accepts local storage URLs only in local mode", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("MEDIA_STORAGE", "local");
    expect(isOwnUploadUrl("/api/media/local/media/a.png")).toBe(true);
  });
});
