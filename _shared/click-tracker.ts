// _shared/click-tracker.ts — Canonical affiliate click tracker
// FTC 2026 / GDPR compliant
import type { ExportedHandler } from "@cloudflare/workers-types";

// ─── Types ───────────────────────────────────────────────────────
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface ProductRow {
  rc_product_url: string;
}

export interface ClickLogPayload {
  product_id: string;
  newsletter_id: string;
  ip_hash: string;
  user_agent: string;
}

export interface ClickHandlerOptions {
  getSlug: (url: URL) => string | null;
  getNewsletterId: (url: URL) => string;
  extraLogFields?: (url: URL, request: Request) => Record<string, unknown>;
}

export class ClickTrackerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ClickTrackerError";
  }
}

// ─── Constants ───────────────────────────────────────────────────
const ALLOWED_REDIRECT_DOMAINS = Object.freeze([
  "rcpeptides.to",
  "www.rcpeptides.to",
] as const);

const IP_HASH_SALT = "rc-peptides-gdpr-salt-2026";

const CORS_HEADERS = Object.freeze({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
}) as const;

export { CORS_HEADERS };

const DISCLOSURE_HEADER = Object.freeze({
  "X-Disclosure": "affiliate-link",
}) as const;

// ─── Utilities ───────────────────────────────────────────────────
export async function hashIP(ip: string, salt = IP_HASH_SALT): Promise<string> {
  const data = new TextEncoder().encode(`${ip}${salt}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

export function validateRedirect(target: string): boolean {
  try {
    const parsed = new URL(target);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_REDIRECT_DOMAINS.includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

// ─── Supabase helpers ────────────────────────────────────────────
async function supabaseJson<T>(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${env.SUPABASE_URL}${path}`;
  const resp = await fetch(url, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...init?.headers,
    },
  });

  if (!resp.ok) {
    throw new ClickTrackerError(
      resp.status,
      `Supabase request failed: ${resp.status} ${resp.statusText}`,
    );
  }

  return resp.json() as Promise<T>;
}

export async function getProduct(
  env: Env,
  slug: string,
): Promise<ProductRow | null> {
  const path =
    `/rest/v1/affiliate_products?slug=eq.${encodeURIComponent(slug)}&select=rc_product_url&limit=1`;

  try {
    const rows = await supabaseJson<ProductRow[]>(env, path);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("Supabase product lookup failed:", err);
    throw err;
  }
}

export async function logClick(
  env: Env,
  payload: ClickLogPayload,
): Promise<void> {
  const path = "/rest/v1/affiliate_clicks";
  const body = JSON.stringify(payload);

  try {
    await fetch(`${env.SUPABASE_URL}${path}`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body,
    });
  } catch (err) {
    console.error("Click logging failed (non-fatal):", err);
  }
}

// ─── Handler factory ─────────────────────────────────────────────
export function createClickHandler(options: ClickHandlerOptions) {
  return {
    async fetch(
      request: Request,
      env: Env,
      ctx: ExecutionContext,
    ): Promise<Response> {
      const url = new URL(request.url);

      // Preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        });
      }

      if (request.method !== "GET") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: CORS_HEADERS,
        });
      }

      // Slug
      const rawSlug = options.getSlug(url);
      if (!rawSlug || !validateSlug(rawSlug)) {
        return new Response("Invalid product id", {
          status: 400,
          headers: CORS_HEADERS,
        });
      }

      // Product lookup
      let product: ProductRow | null;
      try {
        product = await getProduct(env, rawSlug);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Supabase lookup error:", err);
        return new Response("Service unavailable", {
          status: 503,
          headers: {
            ...CORS_HEADERS,
            "X-Debug-Error": msg,
          },
        });
      }

      if (!product || !validateRedirect(product.rc_product_url)) {
        return new Response("Product not found", {
          status: 404,
          headers: CORS_HEADERS,
        });
      }

      // Logging
      const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";
      const ua = request.headers.get("User-Agent") ?? "";
      const ipHash = await hashIP(ip);
      const nid = options.getNewsletterId(url);

      const logPayload: ClickLogPayload = {
        product_id: rawSlug,
        newsletter_id: nid,
        ip_hash: ipHash,
        user_agent: ua.slice(0, 512),
        ...(options.extraLogFields?.(url, request) ?? {}),
      };

      ctx.waitUntil(
        logClick(env, logPayload).catch((err) =>
          console.error("Click log failed (non-fatal):", err),
        ),
      );

      // Redirect
      return new Response(null, {
        status: 302,
        headers: {
          ...CORS_HEADERS,
          ...DISCLOSURE_HEADER,
          Location: product.rc_product_url,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    },
  } satisfies ExportedHandler<Env>;
}

export type { ProductRow as Product, ClickLogPayload as ClickLog };