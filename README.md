# Prismix Website

React + Vite website for Prismix Studios, deployed on Netlify.

---

## Blog storage — current status

> **One-month GitHub posts.json trial — active since 2026-05-25**
>
> Blog posts are read and written via a single JSON file (`data/posts.json`) that
> lives in this repository.  The frontend fetches it directly from GitHub's raw
> CDN.  The agent still POSTs to the Netlify Function, which then updates the
> file on GitHub using the GitHub Contents API.
>
> Netlify Blobs code is **preserved but not active**.  LinkedIn sync is
> **paused for this trial**.  See the revert guide at the bottom of this file.

---

## Architecture overview

```
AI blog agent
  └─ POST /api/blogs (Bearer token)
       └─ Netlify Function (blogs.js)
            ├─ validates + normalises post
            ├─ reads  data/posts.json from GitHub
            ├─ merges / deduplicates
            └─ writes data/posts.json to GitHub   ← commit: [skip netlify]

Browser (/blogs page)
  └─ GET VITE_BLOGS_JSON_URL
       └─ raw.githubusercontent.com/…/data/posts.json
            └─ 5-minute CDN cache-bust  +  60-second in-memory cache
```

**Rules that never change:**

- The browser never calls the Netlify Function for normal reads.
- The GitHub token is never sent to the browser — only the Netlify Function uses it.
- Agent-created posts are never erased or overwritten by a merge.
- Every GitHub write commits with `[skip netlify]` so Netlify does not rebuild the site just because blog content changed.

---

## How posts get into the system

### Path — AI agent (the only active write path during the trial)

The AI agent sends a fully-formed post to the website backend:

```bash
curl -X POST https://<your-site>/api/blogs \
  -H "Authorization: Bearer $BLOG_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Why generative AI is changing film production",
    "body": [
      "First paragraph of the post.",
      "Second paragraph with more detail.",
      "Concluding thoughts."
    ],
    "excerpt": "Optional short summary shown on the blog card.",
    "image": "https://example.com/optional-hero-image.jpg",
    "publishedAt": "2025-05-23T10:00:00Z",
    "linkedinUrl": "https://www.linkedin.com/feed/update/urn:li:share:1234567890/",
    "author": {
      "name": "Sahil Nayar",
      "role": "Co-Founder & CCO",
      "initials": "SN"
    },
    "category": "Craft",
    "tags": ["AIFilmmaking", "Production"],
    "pullQuote": "The sentence you want highlighted as a pull quote."
  }'
```

**Required fields:** `title`, `body` (non-empty array of paragraph strings)

**Optional fields and their defaults:**

| Field         | Default when omitted                                                  |
|---------------|-----------------------------------------------------------------------|
| `excerpt`     | First 280 chars of body text                                          |
| `publishedAt` | Current timestamp                                                     |
| `image`       | `null`                                                                |
| `linkedinUrl` | `null`                                                                |
| `author`      | `{ name: "Prismix Studios", role: "AI Blog Agent", initials: "PS" }` |
| `category`    | `"Prismix Journal"`                                                   |
| `tags`        | `[]`                                                                  |
| `pullQuote`   | First sentence of body, or excerpt if sentence is too short           |

**Validation rules (enforced before any write):**

| Field             | Rule                                                                     |
|-------------------|--------------------------------------------------------------------------|
| `title`           | Required, string, max 200 chars                                          |
| `body`            | Required, non-empty array of strings; max 100 items; each ≤ 10,000 chars |
| `excerpt`         | Optional string, max 600 chars                                           |
| `image`           | Optional; must be an absolute `http`/`https` URL; max 2048 chars        |
| `linkedinUrl`     | Optional; must be an absolute `http`/`https` URL; max 2048 chars        |
| `publishedAt`     | Optional; must parse to a valid date string                              |
| `author.name`     | Optional string, max 200 chars                                           |
| `author.role`     | Optional string, max 100 chars                                           |
| `author.initials` | Optional string, max 10 chars                                            |
| `category`        | Optional string, max 100 chars                                           |
| `pullQuote`       | Optional string, max 600 chars                                           |
| `tags`            | Optional array of strings; max 20 items; each ≤ 100 chars               |

**Responses:**

| Status | Meaning                                                  |
|--------|----------------------------------------------------------|
| `200`  | Post saved — body contains the normalised post JSON      |
| `400`  | Missing or invalid field — plain-text description        |
| `401`  | Wrong or missing `Authorization: Bearer` header          |
| `500`  | Server misconfiguration or GitHub API error              |

### LinkedIn sync — paused for this trial

`sync-linkedin-blogs.js` is preserved but the `@hourly` schedule has been
removed.  The function will not run automatically.  It can still be invoked
manually from the Netlify dashboard for testing.

To re-enable after the trial: restore the `export var config` block at the
bottom of `sync-linkedin-blogs.js` and update the write path to use
`githubPostStore.js` (or revert to Netlify Blobs — see the revert guide below).

---

## Caching

There are two independent caching layers.

**GitHub raw CDN (cache-bust every 5 minutes)**

`raw.githubusercontent.com` caches file content aggressively.  The frontend
appends `?v=<5-minute bucket>` to the URL so that visitors see new posts within
5 minutes of a GitHub commit.

**Client-side in-memory cache (60 seconds, `src/services/blogService.js`)**

`getBlogPosts()` stores the last successful fetch result in a module-level
variable.  If the Blogs page is re-mounted within 60 seconds (SPA navigation),
the cached array is returned instantly — no network request.  After 60 seconds,
the next call fetches fresh from GitHub.

If you need the frontend to show a new post immediately after a `POST /api/blogs`
call, run `invalidateBlogCache()` (exported from `blogService.js`) before
navigating to the Blogs page.

---

## Deduplication rules

When a new post arrives, the merge logic checks for an existing match in order:

1. `id` matches
2. `linkedinUrl` matches (both must be non-null)
3. `source === "linkedin"` and `sourceId` matches (both must be non-null)

On a match the records are merged.  The `website-agent` version wins on text
fields (title, body, tags, image, etc.).  Neither side erases a non-empty field
with an empty/null value from the other side.

---

## Environment variables

### Netlify dashboard (server-side — never sent to the browser)

Set these under **Site settings → Environment variables**.

| Variable             | Required | Description                                                              |
|----------------------|----------|--------------------------------------------------------------------------|
| `BLOG_INGEST_TOKEN`  | Yes      | Secret the agent sends as `Authorization: Bearer`                        |
| `GITHUB_TOKEN`       | Yes      | Personal access token with `contents: write` on the repo                |
| `GITHUB_OWNER`       | Yes      | GitHub user or org that owns the repo                                    |
| `GITHUB_REPO`        | Yes      | Repository name                                                          |
| `GITHUB_BRANCH`      | No       | Branch to read/write (default: `main`)                                   |
| `GITHUB_POSTS_PATH`  | No       | Path to the JSON file in the repo (default: `data/posts.json`)           |

### Netlify dashboard — build-time (embedded in the frontend bundle)

| Variable              | Required | Description                                                             |
|-----------------------|----------|-------------------------------------------------------------------------|
| `VITE_BLOGS_JSON_URL` | Yes      | Full `raw.githubusercontent.com` URL to `data/posts.json`              |

Example value:
```
https://raw.githubusercontent.com/your-org/your-repo/main/data/posts.json
```

> **Note:** `VITE_*` variables are embedded into the JavaScript bundle at build
> time.  They are **public** — do not use this prefix for secrets.

### Legacy — LinkedIn sync (not needed during the trial)

| Variable                | Required | Description                                                          |
|-------------------------|----------|----------------------------------------------------------------------|
| `LINKEDIN_ORG_URN`      | Yes      | e.g. `urn:li:organization:12345678`                                  |
| `LINKEDIN_ACCESS_TOKEN` | Yes      | OAuth 2.0 token with `r_organization_social` scope; expires ~60 days |
| `LINKEDIN_API_VERSION`  | No       | LinkedIn API version header (default: `202401`)                      |

---

## File structure

```
data/
  posts.json                    ← Source of truth during GitHub trial (committed to repo)

netlify/
  functions/
    blogs.js                    ← GET (debug) + POST (agent ingestion) handler
    sync-linkedin-blogs.js      ← Hourly LinkedIn importer — PAUSED for trial
    lib/
      githubPostStore.js        ← ACTIVE: reads/writes data/posts.json on GitHub
      postStore.js              ← LEGACY: Netlify Blobs helpers (preserved, not active)
  .local/
    blogs-posts.json            ← Local dev Blobs store (gitignored, auto-created)

src/
  pages/Blogs.jsx               ← Blog page (reads from blogService)
  services/blogService.js       ← Fetches VITE_BLOGS_JSON_URL; 60s in-memory cache
  data/blogs.js                 ← Static fallback posts (used only if GitHub fetch fails)
```

---

## Netlify functions

| Function                     | Route        | Trigger                           |
|------------------------------|--------------|-----------------------------------|
| `netlify/functions/blogs.js` | `/api/blogs` | On request (GET debug + POST)     |
| `sync-linkedin-blogs.js`     | —            | Schedule disabled during trial    |

### Running the LinkedIn sync manually (for testing only)

Netlify dashboard → **Functions → sync-linkedin-blogs → Run now**, or:

```bash
netlify functions:invoke sync-linkedin-blogs
```

---

## Local development

```bash
npm install
npm run serve   # Vite on :5173 + local function server on :9999
npm run dev     # Vite only — /api/blogs calls fail gracefully, falls back to static posts
```

`npm run serve` starts the full local stack (no Netlify CLI required):
- Vite proxies `/api/*` → `:9999` so the frontend hits the real function code.
- `postStore.js` detects `NETLIFY_DEV=true` and uses `netlify/.local/blogs-posts.json`
  instead of Netlify Blobs.
- For the GitHub write path, fill in `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`
  in `.env` — the function will read/write the real GitHub repo from your machine.

`npm run dev` (Vite only, no function server):
- `getBlogPosts()` fetches `VITE_BLOGS_JSON_URL` if set.
- If the URL is blank or the fetch fails, it falls back to `src/data/blogs.js`.

#### Testing the agent POST locally

```bash
# POST a new post (requires npm run serve)
curl -X POST http://localhost:5173/api/blogs \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test post",
    "body": ["First paragraph.", "Second paragraph."]
  }'
```

---

## How to verify the new setup end-to-end

1. **POST a test post** to `/api/blogs` (see curl above, or use the production URL).
2. **Confirm `data/posts.json` changed on GitHub** — open the file in the GitHub UI
   and check that your new post appears.
3. **Confirm the commit message** contains `[skip netlify]`.
4. **Confirm Netlify did not trigger a new deploy** — check the Netlify dashboard
   under Deploys; a new deploy should not have started.
5. **Confirm the Blogs page shows the new post** — allow up to 5 minutes for GitHub's
   raw CDN to serve the updated file (the cache-buster refreshes on a 5-minute boundary).
   Hard-refresh the page to bypass the 60-second in-memory cache.

---

## Reverting to Netlify Blobs (after the trial)

The Blobs code is fully preserved — nothing was deleted.  To revert:

1. In `netlify/functions/blogs.js`:
   - Comment out the `githubPostStore` imports.
   - Uncomment the `readPosts` / `writePosts` imports from `postStore.js`.
   - In `handleGet`: swap the GitHub call for `readPosts()`.
   - In `handlePost` step 5: swap the GitHub calls for `readPosts()` / `writePosts()`.

2. In `src/services/blogService.js`:
   - Replace `VITE_BLOGS_JSON_URL` fetching with a fetch to `/api/blogs`.

3. In `netlify/functions/sync-linkedin-blogs.js`:
   - Restore the `export var config = { schedule: "@hourly" }` block.

4. Remove `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `VITE_BLOGS_JSON_URL`
   from the Netlify dashboard.

---

## Build

```bash
npm run build   # outputs to dist/
npm run lint    # ESLint check
npm run preview # serve built output locally
```

Commits to the `main` branch trigger an automatic Netlify deploy, **unless** the
commit message contains `[skip netlify]` (which all blog-content commits do).
