// cloudflare-edge-function-affiliate.ts — DEPRECATED
// Prefer `_shared/click-tracker.ts` + Pages Functions binding.
// Kept for reference / legacy deploy only.

import { createClickHandler, type Env } from "./_shared/click-tracker";

export default createClickHandler({
  getSlug: (url) =>
    url.pathname.replace("/api/affiliate/click/", "").split("/")[0] || null,
  getNewsletterId: (url) => url.searchParams.get("nl")?.trim() ?? "unknown",
});
