# TravBud — Travel Companion Prototype

TravBud is a React + TypeScript + Vite travel-planning prototype. It includes a dashboard, destination exploration, trip management, profile, theme toggle, and Supabase authentication/data storage.

## Run locally

Requirements: Node.js 20+ and npm.

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy `.env.example` to `.env.local`.
3. In your Supabase project, copy the **Project URL** and **anon/public key** into `.env.local`.
4. In Supabase SQL Editor, run the SQL migration at `supabase/migrations/20261013131317_create_travbud_schema.sql`.
5. Start the development server:
   ```bash
   npm run dev
   ```

To verify before deployment:
```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy.yml`. It builds the Vite app and deploys `dist` to GitHub Pages when you push to `main`.

1. Create a GitHub repository (for example, `travbud-prototype`) and upload/push the contents of this folder to its `main` branch. Upload the contents, not the outer ZIP folder.
2. In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `VITE_SUPABASE_URL` — your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
3. Open **Settings → Pages** and set the publishing source to **GitHub Actions**.
4. Open the **Actions** tab and wait for **Build and deploy TravBud to GitHub Pages** to complete.
5. Open the Pages URL shown by the workflow deployment.

The Vite build uses relative asset paths so it can work from a GitHub Pages project URL.

## Unified mobility prototype

The **Book & Mobility** page adds an Uber-inspired trip flow with user-triggered place search, a Leaflet/OpenStreetMap map, OSRM road-route estimates, an illustrative multi-segment fare calculator, Hire a Bud sample driver cards, Radar Cargo sample listings, and a generated NUMob demo pass. These are demonstration flows, not real transport bookings. Driver and cargo listings are sample data; fares are estimates and no payments or operator tickets are issued.

### Map services and limits

- Leaflet is the open-source map UI; OpenStreetMap tiles display map data and require attribution. Follow the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
- Place search uses Photon after the user presses Search, rather than querying on each keystroke. Public geocoding services may be rate-limited or changed; check the provider's current usage policy before wider release.
- Road routes use the public OSRM demo endpoint for prototype testing only. It has no availability guarantee and should be replaced with a suitable hosted/self-hosted routing service before production use.
- The fare formula is illustrative and does not represent official transport-operator prices.

## Prototype notes

- The dashboard weather cards currently use static sample temperatures; they are not live weather data.
- Supabase is required for the current sign-in, trip, and saved-destination flows. The frontend uses only the Supabase anon/public key. Never put a Supabase `service_role` key or other private credentials in this repository.
- Before sharing publicly, test account creation/sign-in, trip CRUD, saved destinations, mobile layout, and the Supabase row-level security policies.
