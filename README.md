# Hearth

Hearth is a small, cloneable workspace for a house hunt.

It combines an agent conversation with a living shortlist of homes. Use the conversation to think out loud, compare tradeoffs, and decide what matters. Use the shortlist to keep the facts together and export them when you want to work in a spreadsheet.

## v0.2

The current release includes:

- A public landing page at `/`
- Email + password sign-in at `/login` (bcrypt-hashed credentials, signed session cookie)
- The working workspace at `/workspace`, protected by session middleware
- Per-user shortlists stored in Neon Postgres — synced across devices, nothing in the browser
- Forest Park + Oak Park search areas with an instrumented neighborhood map
- Add a home manually or from a listing URL (auto preview image)
- Click-to-advance status tracking: New → Maybe → Tour → Pass
- KPI strip: tracked count, median price, status mix, tour-ready count
- Download a CSV with `Address`, `Price`, `Beds`, `Baths`, and `Backyard size`
- An Eve-powered agent conversation

## Run locally

Requirements: Node 24, a Neon database, and an Eve-compatible model credential.

Create `.env.local`:

```bash
DATABASE_URL="postgresql://…-pooler.…neon.tech/…?sslmode=require"
AUTH_SECRET="<openssl rand -base64 32>"
```

Then install, seed, and run:

```bash
npm install
npm run seed   # creates users + listings tables, seeds the owner account
npm run dev
```

`npm run seed` is idempotent. Override the defaults with `SEED_EMAIL`, `SEED_NAME`, and `SEED_PASSWORD`; re-running it rotates the seeded account's password. `npm run typecheck` and `npm run build` are available for verification.

## Deploy

This project is configured for Eve's Vercel Build Output and is connected to [`mager/hearth`](https://github.com/mager/hearth).

```bash
vercel --prod --yes
```

Set `DATABASE_URL`, `AUTH_SECRET`, and the required model credentials in the Vercel project environment, then run `npm run seed` once against the production database. Never commit `.env*` or private property data.

## Make it yours

Hearth is intentionally a starting point. Clone it, change the search area, add your own property sources, and connect the CSV export to the spreadsheet you already use.

## License

MIT
