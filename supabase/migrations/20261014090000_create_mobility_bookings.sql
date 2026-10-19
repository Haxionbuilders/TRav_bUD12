-- TravBud prototype mobility bookings.
-- Run this migration in Supabase SQL Editor before using cloud-saved mobility records.
CREATE TABLE IF NOT EXISTS public.mobility_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_code text NOT NULL UNIQUE,
  booking_type text NOT NULL CHECK (booking_type IN ('journey', 'hire_a_bud', 'radar_cargo')),
  origin text NOT NULL,
  destination text NOT NULL,
  total_fare numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_fare >= 0),
  status text NOT NULL DEFAULT 'prototype' CHECK (status IN ('prototype', 'quote', 'cancelled')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mobility_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mobility_bookings" ON public.mobility_bookings;
CREATE POLICY "select_own_mobility_bookings"
  ON public.mobility_bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mobility_bookings" ON public.mobility_bookings;
CREATE POLICY "insert_own_mobility_bookings"
  ON public.mobility_bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mobility_bookings" ON public.mobility_bookings;
CREATE POLICY "update_own_mobility_bookings"
  ON public.mobility_bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mobility_bookings" ON public.mobility_bookings;
CREATE POLICY "delete_own_mobility_bookings"
  ON public.mobility_bookings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mobility_bookings_user_created
  ON public.mobility_bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobility_bookings_type
  ON public.mobility_bookings (booking_type);
