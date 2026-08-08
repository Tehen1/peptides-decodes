-- Supabase migration for affiliate marketing tracking
-- Create tables
CREATE TABLE affiliate_products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  price TEXT NOT NULL,
  promotion_status TEXT NOT NULL,
  evidence_level TEXT NOT NULL,
  rc_product_url TEXT NOT NULL,
  coa_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  newsletter_id TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT
);

-- Enable Row Level Security
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_select ON affiliate_products FOR SELECT USING (true);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY insert_clicks ON affiliate_clicks FOR INSERT WITH CHECK (true);

-- Grant SELECT to anon role (for public reads)
GRANT SELECT ON affiliate_products TO anon;
GRANT INSERT ON affiliate_clicks TO anon;