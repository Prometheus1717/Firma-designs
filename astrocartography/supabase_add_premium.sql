-- Add premium/payment columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- App settings table (key-value store for global config)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Default: paywall enabled
INSERT INTO app_settings (key, value) VALUES ('paywall_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS: anyone can read settings, only service role can write
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage app_settings" ON app_settings
  FOR ALL USING (auth.role() = 'service_role');
