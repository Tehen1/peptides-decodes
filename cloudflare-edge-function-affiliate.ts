// =====================================================
// Cloudflare Edge Function for Affiliate Tracking
// =====================================================
// Route: /api/affiliate/click/[slug]
// Method: GET
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AffiliateClick {
  product_id: string;
  newsletter_id: string | null;
  user_agent: string | null;
  ip_hash: string;
  clicked_at: string;
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function logClick(click: AffiliateClick): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_clicks`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(click)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to log click:", error);
  }
}

async function getProductUrl(slug: string): Promise<string | null> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/affiliate_products?slug=eq.${slug}&select=rc_product_url`,
    {
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Accept": "application/json"
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data[0]?.rc_product_url || null;
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const slug = pathParts[pathParts.length - 1];

  // Validate slug
  if (!slug || slug === "") {
    return new Response(
      JSON.stringify({ error: "Invalid slug" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get client IP (Cloudflare)
  const clientIP = req.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await hashIP(clientIP);

  // Get user agent
  const userAgent = req.headers.get("User-Agent") || null;

  // Get newsletter ID from query params
  const newsletterId = url.searchParams.get("nl") || null;

  // Get product URL from Supabase
  const productUrl = await getProductUrl(slug);

  if (!productUrl) {
    return new Response(
      JSON.stringify({ error: "Product not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Log click asynchronously (don't block redirect)
  const click: AffiliateClick = {
    product_id: slug,
    newsletter_id: newsletterId,
    user_agent: userAgent,
    ip_hash: ipHash,
    clicked_at: new Date().toISOString()
  };

  // Fire and forget (edge function timeout is 10s)
  logClick(click).catch(err => console.error("Click logging failed:", err));

  // Redirect to RC Peptides product page
  return Response.redirect(productUrl, 302);
};

serve(handler);

// =====================================================
// Deployment Instructions
// =====================================================
// 1. Create Cloudflare Worker
// 2. Set environment variables:
//    - SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
// 3. Deploy with: wrangler deploy
// 4. Route: peptides-decodes.pages.dev/api/affiliate/click/*
// =====================================================