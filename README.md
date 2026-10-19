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


## Mobility prototype features

The **Mobility** section contains a connected prototype for: 

- Journey planner with pickup/destination search (Photon), an OpenStreetMap/Leaflet map, and driving route geometry/distance/time from the public OSRM demo endpoint.
- Uber-inspired estimated fare calculator with standard/shared/comfort modes, passenger count, ticket tiers, first-mile pickup, long-distance estimate, destination transfer, and an illustrative platform fee.
- Hire a Bud sample driver/return-trip listings with rider/group selection, seat filtering, route filter, and demo request references.
- Radar Cargo sample vehicle matching, cargo weight/type/date inputs, capacity checks, and sample quote references.
- NUMob Slip preview with a reference code, QR representation, itinerary, tier, fare, passenger count, and print/save-to-PDF action.
- My Bookings, which saves journey previews, sample ride requests, and cargo quotes to Supabase for the signed-in user.

### Enable saved mobility bookings in Supabase

Run the SQL in `supabase/migrations/20261014090000_create_mobility_bookings.sql` in your Supabase project's SQL Editor. Row Level Security policies scope records to the authenticated owner. Existing GitHub Actions secrets should remain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Free map services and limitations

- Map tiles: OpenStreetMap contributors via the public tile service. Keep attribution visible and comply with the tile usage policy.
- Place search: Photon public demo endpoint; search is submitted manually instead of requesting results on every keystroke. Public endpoints may rate-limit requests.
- Driving route: public OSRM demo endpoint. It is best-effort and not a production SLA.
- The QR image is generated by an external QR image service and encodes a demo reference; it is not a ticket-validation system.

**Prototype disclaimer:** drivers, cargo vehicles, fares, transport segments and availability are sample/simulated. No real transport operator, dispatch, payment, insurance, identity verification or ticketing integration is connected. Never present sample estimates as guaranteed operator prices. Before production, use a contracted/appropriately hosted geocoding and routing provider, backend fare calculation, server-side booking validation, verified operator APIs, privacy and safety controls, and production monitoring.


## Authentication configuration (GitHub Pages)

In Supabase **Authentication → URL Configuration**, set the Site URL to your deployed GitHub Pages URL (for this repository: `https://xmoolayil.github.io/TRav_bUD12/`) and add that exact URL to Redirect URLs. Also add your local development URL if needed. Keep the trailing slash consistent. The app sends signup confirmation and Google OAuth users back to the current app URL.

For Google sign-in, enable Google under **Authentication → Providers → Google** and configure a Google OAuth Web client. Add the GitHub Pages origin (`https://xmoolayil.github.io`) as an authorized JavaScript origin, and use the exact callback URL displayed by Supabase as the authorized redirect URI. Paste the Google Client ID and Client Secret into Supabase. Never put the Google client secret in frontend code or GitHub.

Email confirmation links should use Supabase's `{{ .ConfirmationURL }}` template variable. If you customize the email template to use `{{ .RedirectTo }}`, ensure it includes the correct app URL and that the URL is on the Supabase Redirect URLs allow-list. A GitHub Pages project site does not serve arbitrary server routes, so redirect confirmations to the app root rather than a non-existent `/auth/...` frontend route.

The Nearby TravBuds list and Journey Health metrics are clearly simulated prototype data.
