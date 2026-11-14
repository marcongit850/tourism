# Walton County Tourism Network

Preview of the advocacy site for businesses and professionals whose livelihoods depend on tourism in Walton County. It is not a visitor guide. The future public address is [https://waltontourism.org](https://waltontourism.org).

The site is the Cloudflare Worker `tourism-preview`. CSS and fonts are loaded through the worker from the same pinned Builders Network files the live builders site uses:

`https://cdn.jsdelivr.net/gh/marcongit850/builders@5fb1f681f9f25a671eaf3b455794ba632f010665/public`

The seal, favicon, and apple touch icon are embedded in `src/index.js`, so the worker can be published as one JavaScript file.

## Indexing

`const PREVIEW = true` in `src/index.js` is the only indexing switch.

While it is true, HTML responses send `X-Robots-Tag: noindex`, pages use a `noindex` robots meta tag, and `robots.txt` is `Disallow: /`. Canonical, Open Graph, and sitemap URLs still use `https://waltontourism.org`.

Set `PREVIEW` to `false` at launch. Home and `/join` then use `index, follow`. `/login` and `/received` stay `noindex`, matching the builders site. There is no GA4 tag and no Meta Pixel in either mode.

## Redirects

`www.waltontourism.org` redirects to the apex. `http` redirects to `https`. A trailing slash redirects to the path without one. Requests to `127.0.0.1` and `localhost` are not upgraded to https, so local preview still opens. Every other host follows the same redirect rules as the builders worker.

## Run locally

```bash
npm install
npm test
npx wrangler dev --port 43123 --ip 127.0.0.1
```

Membership and contact mail use the `EMAIL` send_email binding. The destination is `marc@whpinc.com`. The From address is `marc@2911studio.com` and the From name is `Walton County Tourism Network`.

## Deploy

Publish this worker only, under the name `tourism-preview`. Do not create a second worker.

```bash
npx wrangler deploy
```

`wrangler.toml` sets `compatibility_date = "2026-11-13"` and:

```toml
[[send_email]]
name = "EMAIL"
destination_address = "marc@whpinc.com"
```

## Facebook

No group exists yet. The footer icon points at `#`. Search `src/index.js` for `TODO` and replace that href when the group is created.

## Logo files

Web images live in `assets/` and are also embedded in the worker:

- `assets/logo-512.webp` (header and hero)
- `assets/favicon-32.png`
- `assets/apple-touch-180.png`
