# 🍳 Starving Artist

An invite-only food-ordering portal for the Wonzimer crew. Ciamac cooks every
other day, posts what’s on the menu (with a photo, options, and a delivery
window), and the crew orders exactly how many they want and how they want it —
hold the onion, no mayo, with or without egg. No payment. Just food.

Built with **Next.js (App Router) + Neon Postgres + Vercel Blob**, designed to
deploy to **Vercel** in a few minutes.

**[→ Deploy it: import this repo into Vercel](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Fcia-mac%2Fcia-mac)**
(then follow steps 3–9 below to add storage + env vars and initialize).

---

## What it does

**For the crew (members):**
- Request access with their email (invite-only — Ciamac handpicks everyone).
- Browse open “drops” (today’s food) with photos and descriptions.
- Pick options per item — e.g. _Protein_: Chicken / Shrimp / Mix, _Egg_: with / without.
- Toggle add-ons (“pick any” groups) and write special requests like “no onion”.
- Choose a quantity and place an order. See and remove their own orders.
- Leave feedback and a star rating.

**For Ciamac (admin / “The Kitchen”):**
- Post a drop: title, description, **photo upload**, delivery date + window.
- Build flexible option groups (required/optional, pick-one or pick-any).
- See every order, plus an auto-tallied **cook list** (“Chicken ×6, Shrimp ×3”)
  and the total number of meals to make.
- Open/close ordering on a drop, or delete it.
- Approve / reject members and grant admin.
- Read all feedback.

---

## Deploy to Vercel (step by step)

### 1. Push this repo to GitHub
It already lives at `cia-mac/cia-mac`. Make sure your branch is pushed.

**Zero configuration.** No secrets to paste, no setup URLs to visit. The app
creates its own database tables and signing secret on first run, and you create
your owner account right in the browser. The only thing you must do is connect a
database.

### 2. Import into Vercel
- Go to [vercel.com/new](https://vercel.com/new) and import the repo.
- Framework preset: **Next.js** (auto-detected). Don’t deploy just yet — add storage first.

### 3. Add a Postgres database (Neon) — the one required step
- In your Vercel project → **Storage** → **Create Database** → **Neon (Postgres)**.
- Connect it to the project. Vercel injects `DATABASE_URL` automatically — that’s
  all the app needs.

### 4. Add Blob storage (only if you want food photos)
- Same **Storage** tab → **Create** → **Blob** → connect it (injects `BLOB_READ_WRITE_TOKEN`).
- _Skip it and everything still works — drops just won’t have photos._

### 5. Deploy
Hit **Deploy** and wait for it to go green.

### 6. Open the site and create your kitchen
Visit your deployment URL. Because no owner exists yet, you’ll land on a
**“Set up your kitchen”** screen — enter your name, email, and a password. That
creates your admin account, logs you in, and pre-fills the menu with today’s
**Chicken Pesto Sandwich** plus **Fried Rice** and **Pasta** examples. Done. 🎉

> First person to open the site becomes the owner, so open it yourself first.

### The photo workflow
Post today’s offer with the **ingredients photo**, then when the food’s done,
swap in the **finished plate**: go to **The Kitchen → the drop → Edit / swap
photo**, choose the new image, save. (Photos need Blob storage from step 4.)

---

## Hooking it up to ciamac.com

Two clean options:

**A. Its own subdomain (simplest)** — e.g. `eats.ciamac.com` or
`starving-artist.ciamac.com`. In Vercel → project → **Domains**, add the
subdomain and follow the DNS instructions. Leave `BASE_PATH` unset.

**B. A path on your main site** — `ciamac.com/starving-artist`. Set the env var
`BASE_PATH=/starving-artist`, redeploy, then add a rewrite on whatever serves
`ciamac.com` so `/starving-artist/*` proxies to this deployment. If ciamac.com is
itself a Vercel project, add to its `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/starving-artist/:path*", "destination": "https://YOUR-DEPLOYMENT-URL/starving-artist/:path*" }
  ]
}
```

---

## Approving members

1. Someone goes to `/signup` and requests access — their account is created as
   **pending** and they land on a “you’re on the list” screen.
2. You go to **The Kitchen → Members**, and **Approve** the people you want.
3. Approved members can immediately log in and order. Reject anyone you don’t.

---

## Local development

```bash
npm install
echo "DATABASE_URL=postgres://..." > .env.local   # a free Neon DB works great
npm run dev
# open http://localhost:3000 and create your kitchen account
```

`DATABASE_URL` is the only thing you need. Tables and the session secret are
created automatically on first run.

## Tech notes

- **Zero config:** schema auto-creates on first query; the JWT signing secret is
  auto-generated and stored in the DB (override with `SESSION_SECRET` if you like).
- **Auth:** email + password. Passwords hashed with Node `scrypt`; sessions are
  signed JWTs in an httpOnly cookie (`jose`). No third-party auth service needed.
- **First run:** first visitor creates the owner account (`/welcome`); the menu
  is seeded with example drops (see `lib/db.ts`).
- **DB:** `@neondatabase/serverless`. **Images:** `@vercel/blob`.
- **No payment** anywhere — this is a friends-and-crew internal tool.
