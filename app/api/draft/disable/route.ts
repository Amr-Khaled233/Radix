import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Leaves draft mode and returns to the page the visitor was on. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const back = new URL(request.url).searchParams.get("to");
  redirect(back && back.startsWith("/") && !back.startsWith("//") ? back : "/");
}
