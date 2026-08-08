-- =====================================================
-- Supabase Template : Newsletter + Tracking Affiliation
-- Peptides Decodes
-- =====================================================

-- =====================================================
-- TABLE 1: ABONNÉS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscribers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  first_name     TEXT,
  last_name      TEXT,
  status         TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','unsubscribed','bounced','pending')),
  source         TEXT,
  tags           TEXT[],
  confirmed_at   TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on subscribers"
  ON public.subscribers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Subscribers see their own row"
  ON public.subscribers FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid())::text = id::text);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.subscribers(status);


-- =====================================================
-- TABLE 2: CAMPAGNES EMAIL
-- =====================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  edition_no   INTEGER,
  body_html    TEXT,
  body_text    TEXT,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','scheduled','sent','archived')),
  segment_tags TEXT[],
  sent_at      TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id)
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users manage campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_edition ON public.campaigns(edition_no);


-- =====================================================
-- TABLE 3: ENVOIS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.campaign_sends (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  subscriber_id  UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','delivered','opened','bounced','failed')),
  sent_at        TIMESTAMPTZ,
  opened_at      TIMESTAMPTZ,
  UNIQUE(campaign_id, subscriber_id)
);

ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sends"
  ON public.campaign_sends FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sends_campaign   ON public.campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sends_subscriber ON public.campaign_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_sends_status     ON public.campaign_sends(status);


-- =====================================================
-- TABLE 4: LIENS D'AFFILIATION
-- =====================================================
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  label        TEXT NOT NULL,
  url_target   TEXT NOT NULL,
  url_slug     TEXT UNIQUE NOT NULL,
  partner_name TEXT,
  commission   NUMERIC(5,2),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users manage affiliate links"
  ON public.affiliate_links FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_affiliate_slug   ON public.affiliate_links(url_slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_active ON public.affiliate_links(is_active);


-- =====================================================
-- TABLE 5: CLICS D'AFFILIATION
-- =====================================================
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  subscriber_id    UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  campaign_send_id UUID REFERENCES public.campaign_sends(id) ON DELETE SET NULL,
  ip_address_hash  TEXT NOT NULL,
  user_agent       TEXT,
  referrer         TEXT,
  clicked_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role inserts clicks"
  ON public.affiliate_clicks FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users read clicks"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_clicks_link      ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_subscriber ON public.affiliate_clicks(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON public.affiliate_clicks(clicked_at);


-- =====================================================
-- VUE ANALYTIQUE : PERFORMANCE PAR CAMPAGNE
-- =====================================================
CREATE OR REPLACE VIEW public.campaign_analytics
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.title,
  c.edition_no,
  c.status,
  c.sent_at,
  COUNT(DISTINCT cs.id)                                          AS total_sent,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'opened')     AS total_opens,
  COUNT(DISTINCT ac.id)                                          AS total_clicks,
  COUNT(DISTINCT al.id)                                          AS affiliate_links_count,
  ROUND(
    COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'opened')
    * 100.0 / NULLIF(COUNT(DISTINCT cs.id), 0), 2
  )                                                              AS open_rate_pct
FROM public.campaigns c
LEFT JOIN public.campaign_sends    cs ON cs.campaign_id = c.id
LEFT JOIN public.affiliate_links   al ON al.campaign_id = c.id
LEFT JOIN public.affiliate_clicks  ac ON ac.affiliate_link_id = al.id
GROUP BY c.id, c.title, c.edition_no, c.status, c.sent_at;
