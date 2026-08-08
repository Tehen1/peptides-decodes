// _shared/click-tracker.ts — Unified canonical click tracker
// FTC 2026 / GDPR compliant
import type { ExportedHandler } from "@cloudflare/workers-types";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
} as const;

const ALLOWED_REDIRECT_DOMAINS = ["rcpeptides.to", "www.rcpeptides.to"] as const;
const IP_HASH_SALT = "rc-peptides-gdpr-salt-2026";

export async function hashIP(ip: string, salt = IP_HASH_SALT): Promise<string> {
  const enc = new TextEncoder().encode(`${ip}${salt}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getProduct(
  env: Env,
  slug: string
): Promise<{ rc_product_url: string } | null> {
  const url =
    `${env.SUPABASE_URL}/rest/v1/affiliate_products` +
    `?slug=eq.${encodeURIComponent(slug)}&select=rc_product_url&limit=1`;
  const resp = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!resp.ok) return null;
  const data = (await resp.json()) as Array<{ rc_product_url: string }>;
  return data.length > 0 ? data[0] : null;
}

export function validateRedirect(target: string): boolean {
  try {
    const parsed = new URL(target);
    return (
      parsed.protocol === "https:" &&
      (ALLOWED_REDIRECT_DOMAINS as ReadonlyArray<string>).includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export async function logClick(
  env: Env,
  payload: Record<string, unknown>
): Promise<void> {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/affiliate_clicks`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error(`Supabase insert failed: ${resp.status} — ${err}`);
  }
}

export interface ClickHandlerOptions {
  getSlug: (url: URL) => string | null;
  getNewsletterId: (url: URL) => string;
  extraLogFields?: (url: URL, request: Request) => Record<string, unknown>;
}

export function createClickHandler(options: ClickHandlerOptions) {
  return {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
      }
      const rawSlug = options.getSlug(url);
      if (!rawSlug || !/^[a-z0-9-]+$/.test(rawSlug)) {
        return new Response("Invalid product id", { status: 400, headers: CORS_HEADERS });
      }
      let product: { rc_product_url: string } | null = null;
      try {
        product = await getProduct(env, rawSlug);
      } catch (err) {
        console.error("Supabase lookup error:", err);
        return new Response("Service unavailable", { status: 503, headers: CORS_HEADERS });
      }
      if (!product || !validateRedirect(product.rc_product_url)) {
        return new Response("Product not found", { status: 404, headers: CORS_HEADERS });
      }
      const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";
      const ua = request.headers.get("User-Agent") ?? "";
      const ipHash = await hashIP(ip);
      const nid = options.getNewsletterId(url);
      const logPayload: Record<string, unknown> = {
        product_id: rawSlug,
        newsletter_id: nid,
        ip_hash: ipHash,
        user_agent: ua.slice(0, 512),
        ...(options.extraLogFields?.(url, request) ?? {}),
      };
      ctx.waitUntil(
        logClick(env, logPayload).catch((err) =>
          console.error("Click log failed (non-fatal):", err)
        )
      );
      return new Response(null, {
        status: 302,
        headers: {
          ...CORS_HEADERS,
          Location: product.rc_product_url,
          "Cache-Control": "no-store, no-cache",
          "X-Disclosure": "affiliate-link",
        },
      });
    },
  } satisfies ExportedHandler<Env>;
}
