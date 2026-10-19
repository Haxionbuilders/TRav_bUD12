/*
# TravBud — Travel Companion App Schema

## Overview
Creates the core database tables for TravBud, a travel companion app where users
plan trips, save favorite destinations, and track activities.

## New Tables

1. **trips** — User's planned trips
   - id (uuid, PK)
   - user_id (uuid, FK to auth.users, defaults to auth.uid())
   - title (text, name of the trip e.g. "Summer in Japan")
   - destination (text, e.g. "Tokyo, Japan")
   - start_date (date)
   - end_date (date)
   - cover_image (text, URL to cover image)
   - budget (numeric, estimated trip budget)
   - notes (text, free-form notes)
   - status (text, 'planning' | 'upcoming' | 'ongoing' | 'completed')
   - created_at (timestamptz)

2. **activities** — Activities/excursions within a trip
   - id (uuid, PK)
   - trip_id (uuid, FK to trips, cascade delete)
   - title (text, e.g. "Visit Senso-ji Temple")
   - date (date)
   - start_time (time, optional)
   - location (text, optional)
   - category (text, 'sightseeing' | 'food' | 'adventure' | 'relaxation' | 'shopping' | 'cultural' | 'other')
   - cost (numeric, optional)
   - notes (text, optional)
   - completed (boolean, default false)
   - created_at (timestamptz)

3. **saved_destinations** — Bucket list of destinations the user wants to visit
   - id (uuid, PK)
   - user_id (uuid, FK to auth.users, defaults to auth.uid())
   - name (text, e.g. "Santorini, Greece")
   - country (text)
   - image_url (text, cover image URL)
   - description (text, short description)
   - visited (boolean, default false)
   - created_at (timestamptz)

## Security
- RLS enabled on all tables.
- All tables are owner-scoped (user_id) with authenticated-only policies.
- activities table is scoped through its parent trip's ownership.
- user_id columns default to auth.uid() so inserts work even when the client omits user_id.

## Notes
1. Trips and saved_destinations have a direct user_id ownership column.
2. Activities are scoped through the parent trip via a subquery check.
3. All policies use auth.uid() for ownership verification.
*/

-- ===== TRIPS TABLE =====
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text NOT NULL,
  start_date date,
  end_date date,
  cover_image text,
  budget numeric(12, 2),
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'upcoming', 'ongoing', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trips" ON trips;
CREATE POLICY "select_own_trips" ON trips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trips" ON trips;
CREATE POLICY "insert_own_trips" ON trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trips" ON trips;
CREATE POLICY "update_own_trips" ON trips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trips" ON trips;
CREATE POLICY "delete_own_trips" ON trips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== ACTIVITIES TABLE =====
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date,
  start_time time,
  location text,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('sightseeing', 'food', 'adventure', 'relaxation', 'shopping', 'cultural', 'other')),
  cost numeric(10, 2),
  notes text DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activities" ON activities;
CREATE POLICY "select_own_activities" ON activities FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = activities.trip_id AND trips.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_activities" ON activities;
CREATE POLICY "insert_own_activities" ON activities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = activities.trip_id AND trips.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_activities" ON activities;
CREATE POLICY "update_own_activities" ON activities FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = activities.trip_id AND trips.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = activities.trip_id AND trips.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_activities" ON activities;
CREATE POLICY "delete_own_activities" ON activities FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = activities.trip_id AND trips.user_id = auth.uid())
  );

-- ===== SAVED DESTINATIONS TABLE =====
CREATE TABLE IF NOT EXISTS saved_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  country text NOT NULL,
  image_url text,
  description text DEFAULT '',
  visited boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_destinations" ON saved_destinations;
CREATE POLICY "select_own_saved_destinations" ON saved_destinations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_destinations" ON saved_destinations;
CREATE POLICY "insert_own_saved_destinations" ON saved_destinations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_destinations" ON saved_destinations;
CREATE POLICY "update_own_saved_destinations" ON saved_destinations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_destinations" ON saved_destinations;
CREATE POLICY "delete_own_saved_destinations" ON saved_destinations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_saved_destinations_user_id ON saved_destinations(user_id);
