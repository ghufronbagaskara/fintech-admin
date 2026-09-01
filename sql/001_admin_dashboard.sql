-- Admin dashboard migration for fintech_pkl. Run in Supabase SQL Editor.
-- Safe to re-run; IF NOT EXISTS / DO blocks guard against duplicate objects.

ALTER TABLE public.merchant
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- NOTE: the Kotlin app's /api/auth/login endpoint does not currently
-- check is_suspended. A suspended merchant can still log in until
-- pkl_fintech/backend/index.js rejects login when is_suspended = true.

-- Every admin action that touches money or merchant state writes one row here.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_email text NOT NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);

-- The Android app talks to the Node backend (service_role key, bypasses RLS),
-- never directly to Supabase, so restricting these tables to `authenticated`
-- doesn't break it.
ALTER TABLE public.merchant       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_account   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_price     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['merchant','merchant_token','balance','installment',
                            'transaksi','bank_account','gold_price','audit_log']
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS admin_full_access ON public.%I;', t
    );
    EXECUTE format(
      'CREATE POLICY admin_full_access ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t
    );
  END LOOP;
END $$;

-- Create the first admin user via Supabase Dashboard > Authentication > Users
-- > Add user (email + password, "Auto Confirm User" checked). Do not insert
-- into auth.users manually via SQL.
