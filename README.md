# KrishiBazaar — AgriMarket India Platform

A complete, runnable full-stack e-commerce application for Indian agri-inputs
(seeds, fertilizer, pesticides, equipment, irrigation, organic, gardening and
animal feed).

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + React Router + TanStack Query
- **Backend:** Node.js + Express + TypeScript REST API
- **Database:** SQLite via Prisma ORM (persistent, file-based, zero-config)
- **Tests:** Vitest + Supertest (API) and Vitest + Testing Library (UI)

---

## 1. Quick start

> Requires **Node.js 18+**. On Windows PowerShell use `npm.cmd` instead of `npm`.

From the repository root:

```bash
# 1. Install everything + create & seed the database (first run only)
npm run setup

# 2. Start the API (port 4000) and the web app (port 5173) together
npm run dev
```

Then open **http://localhost:5173** in your browser.

The Vite dev server proxies `/api/*` to the Express API on `http://localhost:4000`,
so the browser only ever talks to one origin.

### Manual / split start

```bash
# Terminal 1 — API
cd server
npm run dev          # http://localhost:4000

# Terminal 2 — Web
cd web
npm run dev          # http://localhost:5173
```

### First-class scripts

| Command | Where | What it does |
| --- | --- | --- |
| `npm run setup` | root | Install server + web deps, generate Prisma client, push schema, seed data |
| `npm run dev` | root | Run API + web together (concurrently) |
| `npm run build` | root | Type-check + production build for both apps |
| `npm test` | root | Run the API test-suite, then the UI test-suite |
| `npm run db:reset` | root | Drop, re-create and re-seed the SQLite database |
| `npm run db:seed` | root | Re-seed catalog/user data |

---

## 2. Demo accounts

The storefront **auto-bootstraps a frictionless demo session**, so there is no
login wall. Switch roles any time from **Profile → Demo Accounts**.

| Role | Phone | Notes |
| --- | --- | --- |
| Buyer (default) | `9000000000` | Auto-created on first visit |
| Seller / Agri-dealer | `9800000001` | "Patil Agri Seeds & Inputs", owns the seeded catalog |

Open **Seller Hub** (`/seller`) to manage products and orders. If the current
session is a buyer, the seller pages offer a one-tap "Continue as Demo Seller".

### Sign-in & gated actions

The auto-created demo session is a **guest**: you can browse, build a cart and
check out, but two actions require a real sign-in and bounce guests to `/login`
(remembering where they came from):

- **Save to wishlist** — the heart button on product cards / product pages.
- **Publish a product** — every `/seller/*` page (also requires the seller role).

Sign-in entry points: the **Sign in** control in the header (shown to guests),
**Profile → Sign in with mobile number**, or the seller gate. On `/login` you can
either verify a 10-digit mobile number (any 6-digit OTP in demo mode) or use the
one-tap **Dealer / FPO Portal** (a real sign-in) / **Explore Market as Guest
Buyer** (stays a guest).

A plain sign-in then lands on the **profile page** (`/profile`); the *Dealer /
FPO Portal* opens the Seller Hub, and gated actions still return to the page
that was blocked.

### Profile photo

Signed-in users can set a **profile photo** from the profile page — tap the
camera badge (or *Add / Change photo*) and pick an image. The browser centre-crops
and downscales it to a 256 px JPEG, then saves it to the user record via
`PATCH /api/auth/me`, so it persists across reloads and devices. The photo (or
the user's initials as a fallback) also appears at the top-right of the storefront
header. *Remove* clears it. Guests only see a "Sign in to add a profile photo"
prompt.

---

## 3. What's implemented

**Storefront**
- Home: location/weather strip, Kisan AI search banner, hero, category grid,
  live flash-deal countdown rail, season-advisor bundle, tabbed featured catalog,
  farmer testimonials, trust grid, helpline.
- Catalog (`/products`): text search, category chips, price range, minimum
  rating, flash-deal filter, five sort modes, pagination, loading skeletons,
  empty and error states.
- Product detail: gallery with thumbnails, pack-size selector, quantity stepper,
  Mandi-price comparison bar, seller card, related products.
- Cart: server-authoritative totals, quantity editing, remove/clear, free-delivery
  progress bar, savings summary.
- Checkout: address form with inline validation (matches server rules), four
  payment methods (COD / UPI / Card / KCC), saved-address prefill, delivery notes.
- Order confirmation: status timeline, itemised summary, address + payment recap.
- Farmer/dealer profile: storefront header, stats, and full catalog.
- Account: order history, saved addresses, wishlist count, role switcher.

**Seller hub**
- KPI dashboard (revenue, orders, units sold, average order value, stock alerts).
- Product list with publish/delete and a full "Add Product" form with live card
  preview and validation.
- Order board with status filters and one-click status transitions
  (Confirmed → Packed → Shipped → Delivered, plus cancel).

**Cross-cutting**
- Server-side totals and stock validation (never trust the client).
- Client-side + server-side validation with field-level error mapping.
- Loading skeletons, empty states, error states with retry, toast notifications.
- Responsive layout: mobile bottom-nav ↔ desktop header + footer.

---

## 4. Project layout

```
E-commerce/
├─ package.json            # root orchestration (concurrently)
├─ docs/stitch/            # source design system + homepage reference HTML
├─ server/                 # Express + Prisma + SQLite API
│  ├─ prisma/
│  │  ├─ schema.prisma     # User, Seller, Category, Product, Cart, Order, …
│  │  ├─ seed.ts           # 8 categories, 18 products, 2 demo users
│  │  └─ dev.db            # SQLite database (created by `npm run setup`)
│  ├─ src/
│  │  ├─ routes/           # auth, products, categories, cart, orders, seller,
│  │  │                    # sellers (public storefront), addresses
│  │  ├─ services/         # productService, cartService, orderService
│  │  ├─ schemas/          # zod request validation
│  │  ├─ middleware/       # auth (JWT), validation, error handling
│  │  └─ app.ts / index.ts
│  └─ tests/               # Supertest specs (isolated test.db)
└─ web/                    # React storefront + seller UI
   ├─ src/
   │  ├─ api/              # typed client, DTOs, TanStack Query hooks
   │  ├─ components/       # AppShell, ProductCard, Button, States, …
   │  ├─ pages/            # every screen
   │  ├─ store/            # Session + Toast providers
   │  └─ lib/              # formatting + class helpers
   └─ tailwind.config.js   # full KrishiBazaar design tokens
```

---

## 5. API surface

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Service liveness |
| `POST` | `/api/auth/session` | — | Create/sign in a user by phone (`{ phone, role }`) |
| `GET` | `/api/auth/me` | ✅ | Current session user (includes `avatarUrl`) |
| `PATCH` | `/api/auth/me` | ✅ | Update display name and/or profile photo (`{ name?, avatarUrl }`, `null` clears) |
| `GET` | `/api/categories` | — | Categories with product counts |
| `GET` | `/api/products` | — | Search / filter / sort / paginate |
| `GET` | `/api/products/:idOrSlug` | — | Single product |
| `GET` | `/api/products/:slug/related` | — | Same-category recommendations |
| `GET` | `/api/sellers/:id` | — | Public dealer storefront + catalog |
| `GET` | `/api/cart` | ✅ | Current cart with server-computed totals |
| `POST` | `/api/cart/items` | ✅ | Add an item |
| `PATCH` | `/api/cart/items/:id` | ✅ | Change quantity (`0` removes) |
| `DELETE` | `/api/cart/items/:id` | ✅ | Remove an item |
| `DELETE` | `/api/cart` | ✅ | Clear the cart |
| `POST` | `/api/orders` | ✅ | Checkout → creates order, decrements stock |
| `GET` | `/api/orders` | ✅ | Order history |
| `GET` | `/api/orders/:idOrNumber` | ✅ | Single order |
| `GET` | `/api/addresses` | ✅ | Saved delivery addresses |
| `GET` | `/api/seller/stats` | ✅ seller | Dashboard KPIs |
| `GET` | `/api/seller/products` | ✅ seller | Own catalog |
| `POST` | `/api/seller/products` | ✅ seller | Publish a product |
| `PATCH/DELETE` | `/api/seller/products/:id` | ✅ seller | Update / remove a product |
| `GET` | `/api/seller/orders` | ✅ seller | Orders containing own products |
| `PATCH` | `/api/seller/orders/:id/status` | ✅ seller | Advance/cancel an order |

---

## 6. Testing

```bash
npm test                      # both suites (root)
npm --prefix server test      # 48 API tests
npm --prefix web test         # 20 UI/unit tests

npm --prefix web run typecheck
npm --prefix web run build
```

The API suite spins up a disposable `server/prisma/test.db` with deterministic
fixtures, so it never touches your development data.

---

## 7. Design system notes

The visual language (colors, typography scale, spacing tokens, elevation,
motion) is captured from the original Stitch project in
[`docs/stitch/DESIGN.md`](docs/stitch/DESIGN.md) and wired into
[`web/tailwind.config.js`](web/tailwind.config.js) as semantic tokens such as
`bg-surface-container-low`, `text-on-surface-variant`, `text-price-card`,
`px-margin`, `p-space-lg`, and the `skeleton` / `animate-fade-in` utilities.

> **Note on screen fidelity:** the raw HTML for **all ten** Stitch screens of the
> agri project is now stored under [`docs/stitch/screens/`](docs/stitch/screens/)
> (`homepage.html`, `product-listing.html`, `product-details.html`, `cart.html`,
> `checkout.html`, `order-confirmation.html`, `farmer-profile.html`,
> `seller-dashboard.html`, `add-product.html`, `orders-management.html`). They are
> the exact exports from the Stitch project and are used as the source of truth
> when tuning each page. The **login screen** was generated later and exported to
> [`.stitch/designs/krishibazaar-login-29a39512.html`](.stitch/designs/)
> (Sync/CSS metadata lives in [`.stitch/metadata.json`](.stitch/metadata.json) and
> [`.stitch/style-guide.json`](.stitch/style-guide.json); the design tokens are
> byte-identical to `web/tailwind.config.js`).

### Stitch reference screens

| File | Page |
| --- | --- |
| `docs/stitch/screens/homepage.html` | Home (`/`) |
| `docs/stitch/screens/product-listing.html` | Catalog (`/products`) |
| `docs/stitch/screens/product-details.html` | Product detail (`/product/:slug`) |
| `docs/stitch/screens/cart.html` | Cart (`/cart`) |
| `docs/stitch/screens/checkout.html` | Checkout (`/checkout`) |
| `docs/stitch/screens/order-confirmation.html` | Order success (`/order/:id`) |
| `docs/stitch/screens/farmer-profile.html` | Dealer storefront (`/farmers/:id`) |
| `docs/stitch/screens/seller-dashboard.html` | Seller hub (`/seller`) |
| `docs/stitch/screens/add-product.html` | New listing (`/seller/products/new`) |
| `docs/stitch/screens/orders-management.html` | Order board (`/seller/orders`) |
| `.stitch/designs/krishibazaar-login-29a39512.html` | Login & phone verification (`/login`) |

---

## 8. Environment variables

`server/.env` (created for you, safe defaults):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```
