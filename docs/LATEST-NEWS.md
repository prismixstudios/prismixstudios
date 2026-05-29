# Latest News — Website

This document covers the dynamic **Latest News** system as it lives on the
`prismix-website` repo (Netlify Functions, GitHub-backed JSON store, and the
homepage renderer).

For the admin app side (UI to add/edit/reorder/delete), see
`prismix-admin-app/docs/LATEST-NEWS.md`.

---

## 1. What it replaces

The three news cards on the homepage (`src/pages/Home.jsx`) used to be hard-coded.
They are now read from `data/latest-news.json` on GitHub, with a local static
fallback (`src/data/news.js`) for offline development and as a safety net if the
remote fetch fails.

---

## 2. Data model

```ts
interface NewsItem {
  id: string;          // server-generated kebab-case slug of title
  title: string;       // admin-supplied (≤ 200 chars)
  image: string;       // admin-supplied — "/news1.png" OR full https URL
  link: string;        // admin-supplied — full http(s) URL
  published: boolean;  // admin-supplied — draft items hidden from the website
  order: number;       // server-managed, 1-based ascending
  createdAt: string;   // server-set ISO timestamp
  updatedAt: string;   // server-set ISO timestamp
}
```

* **Admin-entered**: `title`, `image`, `link`, `published`.
* **Server-managed**: `id`, `order`, `createdAt`, `updatedAt`.

The seeded `data/latest-news.json` contains the three originally hard-coded
cards in order 1, 2, 3.

---

## 3. Storage

* **Source of truth**: `data/latest-news.json` on the `prismix-website` repo.
* **Writes**: go through Netlify Functions that commit to GitHub via the
  Contents API, with the message
  `chore: update latest news [skip netlify]` so the website does not
  rebuild on every admin edit.
* **Public reads**: the homepage fetches the file directly from
  `raw.githubusercontent.com` so admin edits go live within ~5 minutes
  (GitHub raw CDN cache) without invoking any Netlify Function per visitor.

---

## 4. Netlify Functions

| Function                                  | Route                                | Auth                                | Purpose                                          |
| ----------------------------------------- | ------------------------------------ | ----------------------------------- | ------------------------------------------------ |
| `netlify/functions/latest-news.js`        | `GET /api/latest-news`               | none                                | Returns published items sorted by `order` asc.   |
| `netlify/functions/admin-latest-news.js`  | `GET    /api/admin/latest-news`      | `Bearer NEWS_ADMIN_TOKEN`           | List all (incl. drafts).                         |
|                                           | `POST   /api/admin/latest-news`      | `Bearer NEWS_ADMIN_TOKEN`           | Create item (server fills id, order, dates).     |
|                                           | `PUT    /api/admin/latest-news/:id`  | `Bearer NEWS_ADMIN_TOKEN`           | Partial update.                                  |
|                                           | `DELETE /api/admin/latest-news/:id`  | `Bearer NEWS_ADMIN_TOKEN`           | Delete one item.                                 |
|                                           | `PUT    /api/admin/latest-news/reorder` | `Bearer NEWS_ADMIN_TOKEN`        | Bulk reorder by id list.                          |

Helpers live under `netlify/functions/lib/`:

* `githubNewsStore.js` — read/write `data/latest-news.json` via GitHub Contents API
* `newsValidator.js`   — validation rules for admin input + slug/uniquify helpers

Writes use **optimistic concurrency** (SHA-based) with retry on HTTP 409 / 422.

---

## 5. Frontend rendering

* `src/services/newsService.js` — fetches from `VITE_NEWS_JSON_URL`, applies a
  5-minute CDN cache-buster, caches the result in memory for 60 seconds, and
  falls back to `src/data/news.js` on any failure.
* `src/pages/Home.jsx` — uses `getLatestNews()` and renders the first three
  items in the existing news-card grid. The static seed is used for the first
  paint so SSR/no-JS users still see something.

---

## 6. Environment variables (Netlify)

Set in **Site settings → Build & deploy → Environment**:

| Variable                | Required | Default                     | Used by                                |
| ----------------------- | -------- | --------------------------- | -------------------------------------- |
| `GITHUB_TOKEN`          | ✅       | —                           | Both admin functions (write to GitHub) |
| `GITHUB_OWNER`          | ✅       | —                           | Both admin functions                   |
| `GITHUB_REPO`           | ✅       | —                           | Both admin functions                   |
| `GITHUB_BRANCH`         |          | `main`                      | Both admin functions                   |
| `GITHUB_NEWS_PATH`      |          | `data/latest-news.json`     | News store (path of the JSON file)     |
| `NEWS_ADMIN_TOKEN`      | ✅       | —                           | `admin-latest-news.js` bearer check    |
| `VITE_NEWS_JSON_URL`    |          | —                           | Frontend public read (build-time)      |

`GITHUB_TOKEN` is the same token used by the existing blogs system — give it
`contents: write` on the repo.

`VITE_NEWS_JSON_URL` should be the raw URL of `data/latest-news.json` on the
chosen branch — typically:

```
https://raw.githubusercontent.com/<owner>/<repo>/<branch>/data/latest-news.json
```

---

## 7. Testing the website locally

```bash
npm run build           # confirms Home.jsx + newsService.js compile
npx netlify dev         # serves the SPA + functions

# Public GET (no auth)
curl http://localhost:8888/api/latest-news

# Admin GET (with token)
curl -H "Authorization: Bearer $NEWS_ADMIN_TOKEN" \
  http://localhost:8888/api/admin/latest-news

# Create
curl -X POST http://localhost:8888/api/admin/latest-news \
  -H "Authorization: Bearer $NEWS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test item",
    "image": "/news1.png",
    "link": "https://example.com",
    "published": true
  }'

# Reorder
curl -X PUT http://localhost:8888/api/admin/latest-news/reorder \
  -H "Authorization: Bearer $NEWS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "order": ["id-a", "id-b", "id-c"] }'

# Delete
curl -X DELETE http://localhost:8888/api/admin/latest-news/<id> \
  -H "Authorization: Bearer $NEWS_ADMIN_TOKEN"
```

A 401 means the bearer token is missing/wrong; a 500 means an env var is
missing (check the function logs).

---

## 8. Visibility rules

The website (homepage) and the public `GET /api/latest-news` only return items
where `published !== false`, sorted by `order` ascending. The homepage further
slices to the first **3** items.

The admin `GET /api/admin/latest-news` returns *all* items so drafts can be
managed in the admin UI.

---

## 9. Where to extend

* **Image upload**: out of scope for v1 — admins paste a path or URL.
* **Body / rich content per item**: not currently rendered; if added later, add
  optional fields and update both `newsValidator.js` and the admin form.
* **Caching**: the homepage uses a 60-s in-memory cache. To invalidate after
  an admin save in the same session, call `invalidateNewsCache()` from
  `src/services/newsService.js`.
