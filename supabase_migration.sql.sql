-- Migration: rc_peptides_affiliate_system
-- Generated: 2026-08-06
-- FTC 2026 / GDPR compliant affiliate tracking

BEGIN;

-- ── affiliate_products ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_products (
    id               TEXT PRIMARY KEY,
    product_name     TEXT NOT NULL,
    category         TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    price            TEXT NOT NULL,
    promotion_status TEXT NOT NULL CHECK (promotion_status IN ('RECOMMENDED','ANIMAL_DATA_ONLY','PRESCRIPTION_ONLY','CLINICAL')),
    evidence_level   TEXT NOT NULL CHECK (evidence_level IN ('CLINICAL','PRECLINICAL')),
    rc_product_url   TEXT NOT NULL,
    coa_url          TEXT NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

-- Public read-only (newsletter landing pages, workers)
CREATE POLICY "affiliate_products_public_read"
    ON public.affiliate_products FOR SELECT
    USING (true);

-- Write restricted to service role only (no anon writes)
CREATE POLICY "affiliate_products_service_write"
    ON public.affiliate_products FOR ALL
    USING (auth.role() = 'service_role');

-- ── affiliate_clicks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    TEXT NOT NULL REFERENCES public.affiliate_products(id) ON DELETE CASCADE,
    newsletter_id TEXT NOT NULL,
    clicked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent    TEXT,
    ip_hash       TEXT  -- SHA-256 of IP, GDPR-compliant anonymization
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- No public read on click data (GDPR)
CREATE POLICY "affiliate_clicks_no_public_read"
    ON public.affiliate_clicks FOR SELECT
    USING (auth.role() = 'service_role');

-- Only service role can insert (via Cloudflare Worker with service key)
CREATE POLICY "affiliate_clicks_service_insert"
    ON public.affiliate_clicks FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product_id   ON public.affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_newsletter_id ON public.affiliate_clicks(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at   ON public.affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_slug       ON public.affiliate_products(slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_status     ON public.affiliate_products(promotion_status);

-- ── GDPR retention policy (auto-purge clicks older than 13 months) ────────────
-- Requires pg_cron extension enabled in Supabase dashboard
-- SELECT cron.schedule('purge-old-clicks', '0 3 1 * *',
--   $$DELETE FROM public.affiliate_clicks WHERE clicked_at < NOW() - INTERVAL '13 months';$$
-- );

COMMIT;
