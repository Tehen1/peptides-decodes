// src/index.ts — RC Peptides Affiliate Worker
// Delegates all logic to the shared canonical handler

import { createClickHandler, type Env } from "../../_shared/click-tracker";

export type { Env };

export default createClickHandler({
  getSlug: (url) =>
    url.pathname.replace("/api/affiliate/click/", "").split("/")[0] || null,
  getNewsletterId: (url) => url.searchParams.get("nl")?.trim() ?? "unknown",
});
