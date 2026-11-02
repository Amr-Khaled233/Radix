import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/session";
import { isAllowedPathname, rulesFor } from "@/lib/media/config";
import { storageMode } from "@/lib/media/storage";

const payloadSchema = z.object({ kind: z.enum(["image", "video", "frame"]) });

/** Tells the dashboard uploader which storage is active. */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ mode: storageMode() });
}

/**
 * Vercel Blob client-upload token endpoint. Tokens are issued only to signed-in
 * admins allowed to upload media, for the declared kind's types and size limit.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getAdminUser();
        if (!user || !can(user, "create", "media")) throw new Error("Unauthorized");
        const { kind } = payloadSchema.parse(JSON.parse(clientPayload ?? "{}"));
        if (!isAllowedPathname(pathname, kind)) throw new Error("Invalid pathname");
        if (kind === "frame" && !can(user, "edit", "pages")) throw new Error("Unauthorized");
        const rules = rulesFor(kind);
        return {
          allowedContentTypes: [...rules.types],
          maximumSizeInBytes: rules.maxBytes,
          addRandomSuffix: kind !== "frame",
          allowOverwrite: kind === "frame",
          tokenPayload: JSON.stringify({ userId: user.id, kind }),
        };
      },
      // Media rows are registered by the dashboard right after upload (works locally too).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
