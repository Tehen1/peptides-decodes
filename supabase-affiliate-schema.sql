-- =====================================================
-- Supabase Schema for Peptides Affiliate Tracking
-- =====================================================
-- Generated: 2026-08-06
-- Author: Peptides Decodes
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: affiliate_products
-- =====================================================
CREATE TABLE IF NOT EXISTS affiliate_products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price TEXT NOT NULL,
  promotion_status TEXT NOT NULL CHECK (promotion_status IN ('RECOMMENDED', 'ANIMAL_DATA_ONLY', 'PRESCRIPTION_ONLY')),
  evidence_level TEXT NOT NULL CHECK (evidence_level IN ('CLINICAL', 'PRECLINICAL')),
  rc_product_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_promotion_status ON affiliate_products(promotion_status);
CREATE INDEX IF NOT EXISTS idx_evidence_level ON affiliate_products(evidence_level);
CREATE INDEX IF NOT EXISTS idx_category ON affiliate_products(category);

-- =====================================================
-- Table: affiliate_clicks
-- =====================================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  newsletter_id TEXT,
  user_agent TEXT,
  ip_hash TEXT NOT NULL, -- SHA256 hash of IP (RGPD compliant)
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2)
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_clicks_product ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_clicks_newsletter ON affiliate_clicks(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON affiliate_clicks(clicked_at);

-- =====================================================
-- Table: affiliate_conversions
-- =====================================================
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  click_id UUID NOT NULL REFERENCES affiliate_clicks(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  order_value DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.15,
  commission_amount DECIMAL(10,2) NOT NULL,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- Indexes for revenue tracking
CREATE INDEX IF NOT EXISTS idx_conversions_click ON affiliate_conversions(click_id);
CREATE INDEX IF NOT EXISTS idx_conversions_product ON affiliate_conversions(product_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON affiliate_conversions(status);

-- =====================================================
-- Table: affiliate_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS affiliate_settings (
  id SERIAL PRIMARY KEY,
  partner_name TEXT NOT NULL UNIQUE, -- e.g., 'RC Peptides'
  partner_url TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.15,
  cookie_window_days INTEGER NOT NULL DEFAULT 30,
  payout_minimum DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  payout_method TEXT NOT NULL DEFAULT 'paypal',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default RC Peptides partner
INSERT INTO affiliate_settings (partner_name, partner_url, commission_rate, cookie_window_days, payout_minimum, payout_method)
VALUES ('RC Peptides', 'https://rcpeptides.to', 0.15, 30, 50.00, 'paypal')
ON CONFLICT (partner_name) DO NOTHING;

-- =====================================================
-- RLS Policies (RGPD compliant)
-- =====================================================

-- Enable RLS
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_settings ENABLE ROW LEVEL SECURITY;

-- Products: public read access
CREATE POLICY "Products are publicly viewable" ON affiliate_products
  FOR SELECT USING (true);

-- Clicks: only insert (tracking), no read for public
CREATE POLICY "Anyone can log clicks" ON affiliate_clicks
  FOR INSERT WITH CHECK (true);

-- Clicks: owner can read (via service role)
CREATE POLICY "Owners can view clicks" ON affiliate_clicks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Conversions: owner only
CREATE POLICY "Owners can view conversions" ON affiliate_conversions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Settings: public read (for partner info)
CREATE POLICY "Settings are publicly viewable" ON affiliate_settings
  FOR SELECT USING (active = true);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Hash IP address (RGPD compliant)
CREATE OR REPLACE FUNCTION hash_ip_address(ip TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(sha256(ip::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_affiliate_products_updated_at
  BEFORE UPDATE ON affiliate_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_settings_updated_at
  BEFORE UPDATE ON affiliate_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data (from RC-Peptides-Cleaned-List.csv)
-- =====================================================
-- Note: Run this separately with CSV import or execute INSERT statements

-- Example seed:
/*
INSERT INTO affiliate_products (id, product_name, category, slug, price, promotion_status, evidence_level, rc_product_url)
VALUES 
  ('argirelin-200mg-vial', 'Argirelin 200mg', 'Research Peptides', 'argirelin-200mg-vial', '€80.00', 'RECOMMENDED', 'CLINICAL', 'https://rcpeptides.to/products/argirelin-200mg-vial'),
  ('matrixyl-10mg-vial', 'Matrixyl 10mg', 'Research Peptides', 'matrixyl-10mg-vial', '€30.00', 'RECOMMENDED', 'CLINICAL', 'https://rcpeptides.to/products/matrixyl-10mg-vial'),
  ('ghk-cu-50mg-vial', 'GHK-CU 50mg', 'Research Peptides', 'ghk-cu-50mg-vial', '€35.00', 'ANIMAL_DATA_ONLY', 'PRECLINICAL', 'https://rcpeptides.to/products/ghk-cu-50mg-vial'),
  ('bpc157-10mg-vial', 'BPC-157 10mg', 'Research Peptides', 'bpc157-10mg-vial', '€37.50', 'ANIMAL_DATA_ONLY', 'PRECLINICAL', 'https://rcpeptides.to/products/bpc157-10mg-vial'),
  ('tb500-10mg-vial', 'TB500 10mg', 'Research Peptides', 'tb500-10mg-vial', '€37.50', 'ANIMAL_DATA_ONLY', 'PRECLINICAL', 'https://rcpeptides.to/products/tb500-10mg-vial');
*/

-- =====================================================
-- Views for Analytics
-- =====================================================

-- Daily clicks by product
CREATE OR REPLACE VIEW daily_clicks_by_product AS
SELECT 
  product_id,
  DATE(clicked_at) AS click_date,
  COUNT(*) AS total_clicks,
  COUNT(CASE WHEN converted THEN 1 END) AS conversions,
  SUM(CASE WHEN converted THEN conversion_value ELSE 0 END) AS total_revenue
FROM affiliate_clicks
GROUP BY product_id, DATE(clicked_at)
ORDER BY click_date DESC;

-- Revenue by product (all time)
CREATE OR REPLACE VIEW revenue_by_product AS
SELECT 
  p.product_name,
  p.category,
  p.promotion_status,
  COUNT(c.id) AS total_clicks,
  COUNT(conv.id) AS total_conversions,
  SUM(conv.commission_amount) AS total_commission
FROM affiliate_products p
LEFT JOIN affiliate_clicks c ON p.id = c.product_id
LEFT JOIN affiliate_conversions conv ON c.id = conv.click_id
GROUP BY p.id, p.product_name, p.category, p.promotion_status
ORDER BY total_commission DESC NULLS LAST;

-- =====================================================
-- End of Schema
-- =====================================================