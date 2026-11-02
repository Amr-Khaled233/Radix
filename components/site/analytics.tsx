import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSetting } from "@/lib/site/data";

/** Vercel Analytics + Speed Insights, enabled by env flag or the dashboard setting. */
export async function SiteAnalytics() {
  const general = await getSetting("general");
  const enabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" || general.analyticsEnabled;
  if (!enabled) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
