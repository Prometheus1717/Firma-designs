-- Add premium/payment columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
