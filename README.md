# Hearth

Hearth is a small, cloneable workspace for a house hunt.

It combines an agent conversation with a living shortlist of homes. Use the conversation to think out loud, compare tradeoffs, and decide what matters. Use the shortlist to keep the facts together and export them when you want to work in a spreadsheet.

## v0.2 preview

The first release includes:

- A public landing page at `/`
- The working workspace at `/workspace`
- Forest Park, IL starter listings with a `$500k–$800k` range
- Save and unsave shortlist entries
- Add a home manually
- Download a CSV with `Address`, `Price`, `Beds`, `Baths`, and `Backyard size`
- An Eve-powered agent conversation
- A local workspace profile and browser persistence across refreshes

The profile is intentionally a local preview, not production authentication yet. Listings are stored in the browser, so they do not sync across devices. A real identity provider and database-backed workspace are the next integration layer, alongside Zillow/Redfin ingestion.

## Run locally

Requirements: Node 24 and an Eve-compatible model credential.

```bash
npm install
npm run dev
```

Then open the local URL printed by Eve. `npm run typecheck` and `npm run build` are available for verification.

## Deploy

This project is configured for Eve's Vercel Build Output and is connected to [`mager/hearth`](https://github.com/mager/hearth).

```bash
vercel --prod --yes
```

Set the required model and connection credentials in the Vercel project environment. Never commit `.env` or private property data.

## Make it yours

Hearth is intentionally a starting point. Clone it, replace the starter listings, change the search area, add your own property sources, and connect the CSV export to the spreadsheet you already use.

## License

MIT
