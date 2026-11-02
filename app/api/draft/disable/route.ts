import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturnPath } from "@/lib/safe-redirect";

/** Leaves draft mode and returns to the page the visitor was on. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const { searchParams, origin } = new URL(request.url);
  redirect(safeReturnPath(searchParams.get("to"), origin));
}
