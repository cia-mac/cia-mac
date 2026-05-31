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

### 2. Import into Vercel
- Go to [vercel.com/new](https://vercel.com/new) and import the repo.
- Framework preset: **Next.js** (auto-detected). Don’t deploy just yet — add storage first.

### 3. Add a Postgres database (Neon)
- In your Vercel project → **Storage** → **Create Database** → **Neon (Postgres)**.
- Connect it to the project. Vercel injects the connection env vars automatically
  (`DATABASE_URL` / `POSTGRES_URL` — the app reads either).

### 4. Add Blob storage (for food photos)
- Same **Storage** tab → **Create** → **Blob**.
- Connect it. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically.
- _(If you skip this, the app still works — drops just won’t have photos.)_

### 5. Set the remaining environment variables
Project → **Settings** → **Environment Variables**. Add:

| Variable          | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| `SESSION_SECRET`  | a long random string — run `openssl rand -hex 32`            |
| `SETUP_SECRET`    | another random string (used once to initialize the DB)       |
| `ADMIN_EMAIL`     | `ciamac.parhizi@gmail.com`                                   |
| `ADMIN_PASSWORD`  | a strong password for your admin login                       |
| `ADMIN_NAME`      | `Ciamac` (optional)                                          |

### 6. Deploy
Hit **Deploy**. Wait for it to go green.

### 7. Initialize the database (one time)
Visit this URL once, replacing the secret with your `SETUP_SECRET`:

```
https://YOUR-DEPLOYMENT-URL/api/setup?secret=YOUR_SETUP_SECRET
```

You should see `{"ok":true,...}`. This creates all the tables and your admin
account. It’s safe to run again later (e.g. after changing your admin password).

### 8. Log in
Go to `/login`, sign in with `ADMIN_EMAIL` + `ADMIN_PASSWORD`, and you’ll see
**The Kitchen**. Post your first drop. 🎉

### 9. (Optional) Seed example drops
Want it pre-filled instead of starting blank? Visit once:

```
https://YOUR-DEPLOYMENT-URL/api/seed?secret=YOUR_SETUP_SECRET
```

This creates **today’s Chicken Pesto Sandwich** (open, taking orders) plus
**Fried Rice** and **Pasta with Chicken** as closed past drops — each with the
right option groups (protein/egg, sauce, etc.). It only runs when there are no
drops yet, so it never duplicates.

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
cp .env.example .env.local   # fill in DATABASE_URL, SESSION_SECRET, SETUP_SECRET, ADMIN_*
npm run dev
# then visit http://localhost:3000/api/setup?secret=YOUR_SETUP_SECRET once
```

You’ll need a Postgres connection string in `DATABASE_URL` (a free Neon database
works great for local dev too).

## Tech notes

- **Auth:** email + password. Passwords hashed with Node `scrypt`; sessions are
  signed JWTs in an httpOnly cookie (`jose`). No third-party auth service needed.
- **DB:** `@neondatabase/serverless`. Schema is created idempotently by
  `/api/setup` (see `lib/db.ts`).
- **Images:** `@vercel/blob`.
- **No payment** anywhere — this is a friends-and-crew internal tool.
