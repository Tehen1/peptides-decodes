// =====================================================
// Cloudflare Pages Function for Affiliate Tracking
// =====================================================
// Route: /api/affiliate/click/[slug]
// Method: GET
// FTC 2026 / GDPR compliant
// Uses shared canonical click-tracker
// =====================================================

import { createClickHandler, type Env, CORS_HEADERS } from "../../../../_shared/click-tracker";

export type { Env };

export async function onRequestGet(context: { request: Request; env: Env; params: { slug: string } }) {
  const { request, env, params } = context;
  
  const handler = createClickHandler({
    getSlug: () => params.slug,
    getNewsletterId: (url: URL) => url.searchParams.get("nl")?.trim() ?? "unknown",
  });

  return handler.fetch(request, env, {} as any);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}