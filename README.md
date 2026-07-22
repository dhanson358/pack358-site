# Pack 358 Site

The public recruiting site for **Lovejoy Pack 358** (Cub Scouts, Lucas & Lovejoy, TX) — a static [Astro](https://astro.build) site deployed to Cloudflare Pages, plus a print flyer generated from the same design system. No backend, no database, no login. Content lives in a handful of JSON data files so non-developers can make routine edits.

Design background: `.superpowers/specs/2026-07-22-pack358-website-design.md` (in the planning repo) covers the full rationale — payments via Zeffy, hosting via Cloudflare Pages, photo policy, and the Phase 2 (RSVP) roadmap that is intentionally **not** built yet.

## Pages

| Route            | Purpose                                                    |
| ---------------- | ----------------------------------------------------------- |
| `/`               | Home — hero, year-in-photos, meeting rhythm                |
| `/join`           | Two-step registration (BSA + pack dues), FAQ                |
| `/uniforms`       | What to buy, where to buy it, patch placement               |
| `/our-year`       | Meeting schedule, season-by-season event walk, den structure |
| `/payments`       | Dues + event fee buttons (Zeffy)                             |
| `/health-forms`   | BSA Annual Health & Medical Record upload instructions       |
| `/flyer`          | Print-only 8.5×11 recruiting flyer (source for the PDF)      |

## Editing content

Everything a volunteer needs to change lives in `src/data/*.json`. Edit the file, commit, push to `main` — the site rebuilds and deploys automatically (see [Deployment](#deployment)).

### `src/data/pack.json` — facts, fees, links

Pack name, city, meeting times, BSA/pack/uniform fee amounts, Scout Shop info, and the `links` block (external URLs — see [Pending links](#pending-links) below).

Example — change annual pack dues from $150 to $160:

```json
"fees": { "bsa": 85, "pack": 160, "uniformLow": 50, "uniformHigh": 70 }
```

This one number updates the amount shown on both `/join` and `/payments`.

**Important:** any `links` value left as the literal string `"PENDING"` is not broken — the site automatically falls back to a `mailto:info@lovejoypack358.com` button with a pre-filled subject line, so the page still works before the real URL exists. Replace `"PENDING"` with the real URL once you have it (see `src/lib/links.ts`, the `linkOr()` helper, for how this fallback works).

### `src/data/fees.json` — event fee buttons

An array of `{ "label": "...", "url": "..." }` objects rendered as buttons on `/payments`, under the dues button. Empty array (`[]`) means "no event fees right now" and the page shows that message instead.

Example — add a Fall Campout fee once the Zeffy form exists:

```json
[{ "label": "Fall Campout — $25", "url": "https://www.zeffy.com/en-US/ticketing/your-form-slug" }]
```

Remove the entry (or empty the array) once the event has passed.

### `src/data/year.json` — season events

An array of `{ "season": "Fall" | "Winter" | "Spring" | "Summer", "events": [{ "name", "blurb" }] }` objects that drive the `/our-year` walk-through. Add, remove, or reword events here — no code changes needed.

### `src/data/faqs.json` — join-page FAQ

An array of `{ "q", "a" }` pairs shown as the FAQ strip on `/join`.

### Photos — `src/assets/photos/`

Swap photos **1:1 by filename** — the code references `campout.png`, `derby.png`, `hike.png`, `regatta.png`, and `rocket.png`. Replace the file contents but keep the same filename and it will show up everywhere that photo is used (home page cards, flyer).

Only use photos that are **faceless or release-cleared** — from-behind, silhouette, or hands-only shots, matching the style of the current AI-generated placeholders, unless you have a signed photo release for every identifiable child in the shot.

## Local development

```bash
npm install
npx playwright install chromium   # one-time; only needed for the flyer PDF export
npm run dev                       # local dev server, http://localhost:4321
npm run build                     # production build to ./dist
npm run check                     # build + recursive link check (fails on dead links)
npm run qr                        # regenerate the flyer's QR code
npm run flyer                     # build + render flyer.pdf from /flyer
```

`npm run check` is what CI runs on every push — run it locally before pushing if you've touched links or navigation.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: checkout → `npm ci` → `npm run check` → deploy `dist/` to the Cloudflare Pages project `pack358-site` via `cloudflare/wrangler-action`, authenticated with two GitHub repo secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

### One-time setup checklist (David)

1. **Create the GitHub repo** — `pack358-site`, push `main` to it (if not already done).
2. **Create the Cloudflare Pages project** — Cloudflare dashboard → Workers & Pages → Create → Pages → **Upload assets** (direct upload type, not "Connect to Git" — the GitHub Action handles deploys). Name it exactly `pack358-site` (must match `--project-name` in the workflow).
3. **Create a Cloudflare API token** — My Profile → API Tokens → Create Token → permission **"Cloudflare Pages: Edit"**. Also grab the **Account ID** from the right-hand sidebar of any Cloudflare dashboard page.
4. **Add GitHub repo secrets** — repo Settings → Secrets and variables → Actions → add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` with the values from step 3.
5. **Push to `main`** — the workflow runs and deploys. You'll get a `*.pages.dev` URL from Cloudflare after the first successful deploy.
6. **Attach the custom domain** — in the Pages project → Custom domains → add `lovejoypack358.com`.

## DNS cutover — read this before touching anything

**The domain's email currently runs on Google** (MX record `smtp.google.com`). Moving DNS carelessly will break `info@lovejoypack358.com` and any other Google Workspace mail on the domain. Do not switch nameservers until you've confirmed mail will keep working.

Current state:

- Nameservers: `ns6421.hostgator.com` / `ns6422.hostgator.com` (HostGator)
- Registrar: Launchpad.com / HostGator
- **Domain expires 2026-10-08 — renew it before doing anything else with DNS or the registrar.**

Recommended order of operations:

1. **Renew the domain at Launchpad first.** Don't let it lapse mid-cutover.
2. **Add the site to Cloudflare (free plan).** Cloudflare will scan and auto-import the existing DNS zone from HostGator.
3. **Verify the imported zone before switching anything** — specifically confirm the MX record(s) pointing at `smtp.google.com` and any Google verification **TXT** records are present in the Cloudflare zone. If anything is missing, add it manually before proceeding.
4. **Only then switch the domain's nameservers** at Launchpad to the Cloudflare-assigned nameservers.
5. **Later**, once things are stable, consider transferring the domain registration itself to Cloudflare Registrar (optional, not required for the site to work).

If in doubt, pause and re-check the zone in Cloudflare against the current HostGator records before flipping nameservers — an email outage for the pack's main contact address is worse than a delayed site launch.

## Pending links

`src/data/pack.json` ships with several `links` values set to `"PENDING"`. The site works fine in that state (see the mailto fallback above), but replace each with the real URL as it becomes available:

| Key                  | Where the URL comes from                                                              | Where it's used                          |
| --------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| `beAScout`            | beascout.scouting.org — the pack's official "Apply" / unit invite link                  | `/join` (Step 1 registration button)      |
| `zeffyDues`           | The pack treasurer creates a Zeffy dues form (see [Zeffy setup](#zeffy-setup)); copy its checkout URL | `/join` (Step 2 button) and `/payments` (Annual Dues button) |
| `scoutbookCalendar`   | ScoutBook → pack calendar → share/export link                                          | `/our-year` and the site footer           |
| `healthFormUpload`    | The pack's Google Form URL (built on the pack-owned Google Workspace account)           | `/health-forms` (upload button)           |

## Zeffy setup

Full checklist lives in the design spec (`.superpowers/specs/2026-07-22-pack358-website-design.md`, "Treasurer stack" section). In short, before pasting the dues URL into `zeffyDues`:

- Create the Zeffy account with a **pack-owned email**, not a personal one.
- Register under the **council's 501(c)(3) EIN** — give the council office a heads-up first.
- Connect the pack bank account.
- Build the dues form with required questions for **scout name** and **den/grade**.
- Invite a **second admin** (e.g. Cubmaster or committee chair) so the account isn't a single point of failure.

## Succession

Handing this off to the next tech-comfortable volunteer means transferring three things:

1. The **GitHub repository** (transfer ownership or add as a collaborator).
2. **Cloudflare account access** (the Pages project and, if applicable, the DNS zone).
3. **Domain access** (registrar login, or ownership if the domain has been transferred to Cloudflare Registrar).

Beyond that, day-to-day maintenance is just editing the JSON files in `src/data/` and swapping photo files — no build tooling or coding knowledge required for routine content updates.
