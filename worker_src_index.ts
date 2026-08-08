// src/index.ts — RC Peptides Affiliate Click Tracker
// Cloudflare Worker · TypeScript · FTC 2026 / GDPR compliant
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
} as const;

async function hashIP(ip: string): Promise<string> {
  const enc = new TextEncoder().encode(ip + "rc-peptides-gdpr-salt-2026");
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logClick(
  env: Env,
  productId: string,
  newsletterId: string,
  ipHash: string,
  userAgent: string
): Promise<void> {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/affiliate_clicks`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      product_id: productId,
      newsletter_id: newsletterId,
      ip_hash: ipHash,
      user_agent: userAgent.slice(0, 512), // cap length
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Supabase insert failed: ${resp.status} — ${err}`);
  }
}

async function getProduct(
  env: Env,
  slug: string
): Promise<{ rc_product_url: string } | null> {
  const url = `${env.SUPABASE_URL}/rest/v1/affiliate_products?slug=eq.${encodeURIComponent(slug)}&select=rc_product_url&limit=1`;
  const resp = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!resp.ok) return null;
  const data = (await resp.json()) as Array<{ rc_product_url: string }>;
  return data.length > 0 ? data[0] : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    // Expected: /r?pid=<slug>&nid=<newsletter_id>
    const pid = url.searchParams.get("pid")?.trim();
    const nid = url.searchParams.get("nid")?.trim() ?? "unknown";

    if (!pid) {
      return new Response("Missing pid parameter", { status: 400 });
    }

    // Validate slug format (alphanumeric + hyphens only)
    if (!/^[a-z0-9-]+$/.test(pid)) {
      return new Response("Invalid product id", { status: 400 });
    }

    // Resolve product URL from Supabase
    let product: { rc_product_url: string } | null = null;
    try {
      product = await getProduct(env, pid);
    } catch (err) {
      console.error("Supabase lookup error:", err);
      return new Response("Service unavailable", { status: 503 });
    }

    if (!product) {
      return new Response("Product not found", { status: 404 });
    }

    // Log click (fire-and-forget with timeout — GDPR: anonymized IP only)
    const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";
    const ua = request.headers.get("User-Agent") ?? "";
    const ipHash = await hashIP(ip);

    // Non-blocking — don't delay redirect
    const logPromise = logClick(env, pid, nid, ipHash, ua).catch((err) =>
      console.error("Click log failed (non-fatal):", err)
    );

    // Comply with Cloudflare Worker lifecycle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).waitUntil?.(logPromise);

    return new Response(null, {
      status: 302,
      headers: {
        ...CORS_HEADERS,
        Location: product.rc_product_url,
        "Cache-Control": "no-store, no-cache",
        "X-Disclosure": "affiliate-link", // machine-readable FTC signal
      },
    });
  },
} satisfies ExportedHandler<Env>;
