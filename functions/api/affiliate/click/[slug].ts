// =====================================================
// Cloudflare Pages Function for Affiliate Tracking
// =====================================================
// Route: /api/affiliate/click/[slug]
// Method: GET
// FTC 2026 / GDPR compliant
// Uses shared canonical click-tracker
// =====================================================

console.debug("[affiliate] Pages Function loaded for /api/affiliate/click/[slug]");

import { createClickHandler, type Env } from "../../_shared/click-tracker";

export type { Env };

export async function onRequestGet(context: { request: Request; env: Env; params: { slug: string } }) {
  const { request, env, params } = context;
  
  const handler = createClickHandler({
    getSlug: () => params.slug,
    getNewsletterId: (url: URL) => url.searchParams.get("nl")?.trim() ?? "unknown",
  });

  return handler.fetch(request, env, {} as any);
}