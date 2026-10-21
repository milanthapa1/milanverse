# MilanVerse

**Your personal internet universe.**

MilanVerse is a private launchpad for the corners of the internet you actually
use. Save a link once, file it under a category and a few tags, then find it
again with a keystroke — from a dashboard, a search page, or the command
palette. It is a single-user-per-account app: every query is scoped to the
signed-in user, and nothing is public unless you sign out.

Built with the Next.js App Router, Neon Postgres, Prisma and Auth.js, with a
cosmic dark-first design and a fully designed light theme.

---

## Features

**Capture**

- Add a link from any screen; metadata (title, description, thumbnail, favicon)
  is fetched server-side with an SSRF-hardened scraper and can be edited before
  saving.
- URL normalization means `http://www.Example.com/watch/?utm_source=x` and
  `https://example.com/watch` are the same bookmark — duplicates are caught by a
  unique index, not a race-prone pre-check.
- Bookmark import from any browser's Netscape HTML export, with folder→tag
  mapping and automatic duplicate skipping.

**Organize**

- Categories with icons and per-category colour tints; delete a category and
  its links survive as uncategorized.
- Free-form tags with rename-safe linking and tag pages.
- Favourites, recently opened (tracked on every launch), and a trash with
  restore plus permanent delete.

**Find**

- Full search over titles, descriptions, URLs, tags and categories.
- `⌘K` / `Ctrl+K` command palette: navigation, search, quick-open, add-link and
  theme switching without leaving the keyboard.
- Dashboard with stats, recent activity and category overview.

**Feel**

- Dark-first cosmic UI (deep navy, violet primary, cyan/magenta accents) over a
  pausable starfield that respects `prefers-reduced-motion`.
- Framer Motion transitions that degrade to no-ops when motion is reduced.
- Mobile-first layout: bottom navigation, safe-area padding, touch-sized
  targets, and a designed light theme rather than an inverted afterthought.
- Accessible primitives (Base UI + shadcn/ui), labelled controls, visible focus
  states and toast feedback for every mutation.

**Account**

- Google and GitHub OAuth via Auth.js, JWT sessions, Prisma adapter, and a
  per-user profile seeded with default categories on first sign-in.
- Settings page with profile, appearance, stats and sign-out; activity timeline
  derived from link history without an extra table.

---

## Tech stack

| Layer      | Choice                                                                |
| ---------- | --------------------------------------------------------------------- |
| Framework  | Next.js 16.4 (App Router, Turbopack, Cache Components / PPR)          |
| Language   | TypeScript, `strict`                                                  |
| UI         | Tailwind CSS v4, shadcn/ui on Base UI, lucide-react, Framer Motion     |
| Theming    | next-themes (dark default, system + light), CSS custom properties      |
| Data       | Neon Postgres, Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) |
| Auth       | Auth.js v5 (`next-auth@beta`), `@auth/prisma-adapter`, Google + GitHub |
| Forms      | react-hook-form + Zod + `@hookform/resolvers`                          |
| Search/CMD | cmdk                                                                   |
| Feedback   | sonner                                                                 |
| Scraping   | open-graph-scraper behind a custom SSRF guard                          |
| Testing    | Vitest                                                                 |

`@tanstack/react-query` is installed for client-side cache needs that outgrow
server components; the MVP reads through server components and server actions.

---

## Getting started

### Prerequisites

- Node.js 20.9+ (developed on Node 26)
- npm
- A Postgres database — [Neon](https://neon.tech) is the reference target, but
  any Postgres 15+ works

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in:

| Variable                                   | Required | Notes                                                        |
| ------------------------------------------ | -------- | ------------------------------------------------------------ |
| `DATABASE_URL`                             | yes      | Pooled connection string used at runtime                     |
| `DIRECT_URL`                               | yes      | Direct connection string used by migrations                  |
| `AUTH_SECRET`                              | auth     | `npx auth secret` or `openssl rand -base64 32`               |
| `AUTH_URL`                                 | auth     | Public base URL, e.g. `http://localhost:3000`                |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`    | optional | Enables Google sign-in                                       |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`    | optional | Enables GitHub sign-in                                       |
| `APP_URL`                                  | yes      | Canonical URL for metadata, OG images and share links (server-only) |
| `FEATURE_AVATAR_UPLOAD`, `CLOUDINARY_*`     | no       | Scaffolded flag; avatar upload is not part of the MVP        |

`AUTH_SECRET` is mandatory whenever any OAuth provider is configured.

### 3. Database

```bash
npm run db:migrate    # prisma migrate dev — creates the schema
npm run db:seed       # optional: demo categories + a starter collection
```

Migrations use `DIRECT_URL` (see `prisma7.config.ts`) so they never go through
the connection pooler.

### 4. OAuth callbacks

Register these redirect URIs with each provider (replace the origin for
production):

- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

A provider is only registered when both its ID and secret are present, so you
can start with one of the two.

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Demo mode

MilanVerse boots without credentials so the UI can be explored immediately.
Demo mode activates automatically when **either**:

- no OAuth provider is fully configured **or**
- `DATABASE_URL` is missing/invalid

In demo mode the proxy protection is bypassed, the session resolves to a demo
profile, and reads/writes use an in-memory store seeded with sample links —
everything is interactive, and a server restart resets it. No database or OAuth
setup is required to click around.

To force demo mode against a real `.env`:

```powershell
$env:DATABASE_URL=""   # PowerShell
npm run dev
```

---

## Scripts

| Script              | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack)                      |
| `npm run build`     | Production build (type-checks the project)            |
| `npm run start`     | Serve the production build                            |
| `npm run lint`      | ESLint                                                |
| `npm run typecheck` | `tsc --noEmit`                                        |
| `npm run test`      | Vitest, single run                                    |
| `npm run test:watch`| Vitest in watch mode                                  |
| `npm run db:migrate`| `prisma migrate dev`                                  |
| `npm run db:deploy` | `prisma migrate deploy` (production)                  |
| `npm run db:push`   | `prisma db push` (prototyping only)                   |
| `npm run db:seed`   | Seed demo content                                     |
| `npm run db:studio` | Prisma Studio                                         |
| `npm run db:generate`| Regenerate the Prisma client                         |

---

## Routes

| Route                    | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `/`                      | Marketing landing page                                    |
| `/signin`                | Google / GitHub sign-in                                   |
| `/dashboard`             | Stats, recent links, category overview                    |
| `/collection`            | Every saved link with filters and sorting                 |
| `/favorites`             | Starred links                                             |
| `/recently-opened`       | Launch history                                            |
| `/trash`                 | Soft-deleted links: restore or delete forever             |
| `/search`                | Full-text search across link fields                       |
| `/categories`            | Create, edit, reorder, delete categories                  |
| `/category/[slug]`       | Links in one category                                     |
| `/tags`                  | Tag cloud                                                 |
| `/tag/[name]`            | Links with one tag                                        |
| `/link/[id]`             | Link details, edit, stats, delete                         |
| `/activity`              | Derived timeline of saved/opened/updated links            |
| `/settings`              | Profile, appearance, stats, import, sign-out              |
| `/import`                | Bookmark HTML importer                                    |
| `/api/auth/[...nextauth]`| Auth.js handlers                                          |
| `/api/metadata`          | SSRF-guarded metadata fetch used by the add-link flow     |

Protected segments are enforced in `src/proxy.ts` (cookie-presence check) and
again in the data layer (`requireUser()`), so a missing proxy check can never
expose another user's rows.

---

## Architecture

```text
src/
├─ app/
│  ├─ (marketing)/          landing page, sign-in
│  ├─ (app)/                authenticated shell + every signed-in view
│  └─ api/
│     ├─ auth/[...nextauth] Auth.js route handler
│     └─ metadata/          hardened Open Graph fetcher
├─ components/
│  ├─ layout/               header, sidebar, mobile nav, theme toggle
│  ├─ links/                cards, forms, importer, detail views
│  ├─ categories/ tags/     category and tag UI
│  ├─ effects/              starfield, command palette, page transitions
│  └─ ui/                   shadcn/ui primitives
├─ lib/
│  ├─ ssrf.ts               URL policy + DNS pinning for outbound fetches
│  ├─ bookmarks.ts          Netscape bookmark parser
│  ├─ url.ts                coerce/normalize/derive favicon helpers
│  ├─ ranking.ts            pure relevance scoring for search
│  ├─ auth.ts auth-env.ts   Auth.js config and demo-mode detection
│  ├─ rate-limit.ts         in-memory sliding window
│  └─ validators/           Zod schemas shared by actions and forms
├─ server/
│  ├─ actions/              "use server" mutations (Zod → requireUser → write)
│  ├─ categories.ts links.ts users.ts stats.ts   data access layer
│  └─ demo-data.ts          in-memory store used in demo mode
├─ proxy.ts                 route protection (Next 16 middleware replacement)
└─ generated/prisma/        generated Prisma client (do not edit)
prisma/
├─ schema.prisma            User, Account, Session, Category, Tag, Link, LinkTag
├─ migrations/
└─ seed.ts
```

Key conventions:

- **Server components read, server actions write.** Every action validates with
  Zod, resolves the session user, applies a per-user write rate limit, scopes
  the mutation by `userId`, and revalidates the app shell.
- **Ownership is enforced in SQL.** Updates and deletes use `updateMany` /
  `deleteMany` with `where: { id, userId }` and check the affected row count,
  so a guessed ID returns "not found" rather than touching another account.
- **Cache Components.** Pages await `connection()` before request-time reads
  (session, cookies, per-user data) and expose them inside `<Suspense>`, so the
  static shell prerenders while personal content streams. The layout does the
  same for its header and sidebar sections.
- **One source of truth for actions' results.** Mutations return
  `ActionResult<T>` (`{ ok: true, data }` or `{ ok: false, error, code }`), which
  the client renders as inline errors and toasts.
- **Demo mode is a first-class branch**, not a mock bolted onto tests: the same
  components and actions work with no database (see `src/server/demo-data.ts`).

---

## Security model

### SSRF guard (`/api/metadata`)

User-supplied URLs are never fetched directly. `src/lib/ssrf.ts` enforces:

- `http:` / `https:` only; embedded credentials (`user:pass@host`) are rejected.
- Hostnames are DNS-resolved before the request and **every** returned address
  is checked against blocked ranges: loopback, private (RFC 1918), link-local,
  carrier-grade NAT, multicast/reserved, documentation ranges, IPv6
  unique-local/link-local, IPv4-mapped IPv6 and cloud metadata endpoints
  (`169.254.169.254`, `100.100.100.200`, `fd00:ec2::254`,
  `metadata.google.internal`).
- `localhost`, `*.localhost`, `*.internal`, `*.local` and known metadata aliases
  are denied outright.
- The resolved address is pinned via a custom lookup, so a DNS-rebinding
  response cannot swap in an internal IP between check and connect.
- At most **3 redirects**, each re-validated through the same policy.
- **5 s** total timeout, **2 MB** response cap, and only HTML-ish content is
  parsed.

### Session scoping

Every read and write goes through the data access layer with the session
`userId` as the first argument. There is no "get by id" without an owner in the
`where` clause. Protected routes are gated optimistically in `src/proxy.ts` and
authoritatively by `requireUser()` inside each page/action.

### Input validation

Every route handler and server action parses its input with a Zod schema from
`src/lib/validators/`. Unknown keys are stripped, lengths are bounded, and enum
values (sort orders, category icons) are allow-listed. File uploads are capped
both client- and server-side.

### Rate limiting

`src/lib/rate-limit.ts` implements a per-key sliding window:

- `writes:{userId}` — 60 requests/minute across all mutations
- `metadata:{ip}` — 20 requests/minute on the scraper endpoint

It is in-memory by design for a single instance. For multi-instance or
serverless deployments, replace the store with Upstash Redis — the call sites
only use `rateLimit()`, so it is a drop-in swap.

### Headers and CSP

`next.config.ts` sets on every response:

- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` + `Content-Security-Policy: frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denying camera, microphone, geolocation, payment and
  browsing-topics
- `Cross-Origin-Opener-Policy: same-origin`
- `poweredByHeader: false`

The CSP deliberately omits `script-src`/`style-src`: a nonce-based script policy
would force every page to render dynamically and defeat the prerendered shell.
It still locks down framing, `<base>` injection, plugins and form targets.

### Remote images

`images.remotePatterns` is an explicit allow-list — Google favicons, DuckDuckGo
icons and Cloudinary (for the avatar flag). No wildcard hosts.

---

## Bookmark import

Export bookmarks from Chrome, Firefox, Safari or Edge (all produce the Netscape
HTML format), then open **Settings → Import bookmarks** or `/import`.

- Files must be `.html`/`.htm` and at most **2 MB**.
- Up to **500** bookmarks per run; extra entries are reported as truncated and
  the file can be split.
- Optional: import everything into one category and/or turn the deepest folder
  name into a tag (`Design / UI` → `ui`).
- Each URL is coerced and normalized; unusable schemes (mailto, javascript,
  file, data…) and duplicates — including links already in the trash — are
  skipped. The summary reports imported / duplicates / unusable / failed counts.
- Inserts run in chunks with bounded concurrency; a unique-constraint race is
  counted as a duplicate, never as a hard failure.

The parser lives in `src/lib/bookmarks.ts`; the action is
`src/server/actions/import.ts`.

---

## Testing

```bash
npm run test
```

42 tests across three suites, all pure and offline:

- `src/lib/url.test.ts` — protocol coercion, non-web scheme rejection,
  credentials rejection, normalization (https upgrade, `www`, fragments,
  tracking params, query sorting, aliases, default ports), domain/label/favicon
  helpers.
- `src/lib/ssrf.test.ts` — IPv4/IPv6 range blocking, metadata endpoints, scheme
  and credential rejection, hostname denials, and a public-IP allow case.
- `src/lib/bookmarks.test.ts` — Netscape parsing (folders, nesting, entities,
  quoting), empty/invalid files, the 2 MB cap and the 500-bookmark limit.

Vitest is configured in `vitest.config.mts` with the `@/` alias; no DOM,
database or network is required.

---

## Deployment

### Vercel + Neon

1. Create a Neon project and copy both the pooled and direct connection strings.
2. Import the repository into Vercel.
3. Set the environment variables from `.env.example` in the project settings —
   at minimum `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`,
   `APP_URL` and your OAuth credentials.
4. Set both OAuth callback URLs to
   `https://your-domain/api/auth/callback/{google,github}`.
5. Apply migrations once from your machine (or a CI step) with production
   credentials:

   ```bash
   npm run db:deploy
   ```

6. Deploy. The build runs `next build`; migrations are intentionally separate
   from the build so deployments never race each other on schema changes.

`AUTH_URL` and `APP_URL` must match the deployed origin, or OAuth
redirects and share/OG links will point at the wrong host.

### Notes for production

- The rate limiter is per-instance and in-memory. On serverless or multi-region
  deployments, move it to a shared store (see above).
- Security headers include HSTS; ensure the domain is HTTPS-only before
  enabling it elsewhere.

---

## Known notes

- **Build font warning.** Next's font optimizer logs
  `Failed to load dynamic font for ⌘ … Status: 400` while prerendering the
  command-palette key hint. It is cosmetic, does not affect the bundle, and the
  glyph falls back to the system font.
- **`npm audit`.** The remaining advisories are all in dev-only tooling
  (ESLint/Next lint config, shadcn's registry/ts-morph chain, `fast-glob` /
  `micromatch` / `braces`). `npm audit fix --force` resolves them by downgrading
  `shadcn` to a breaking major, so they are documented rather than forced. None
  ship in the runtime bundle.
- **Cloudinary avatar upload** is scaffolded behind `FEATURE_AVATAR_UPLOAD` and
  is not part of the MVP; the allow-listed image host is already in place for
  when it lands.

---

Built for one person's internet — yours.
