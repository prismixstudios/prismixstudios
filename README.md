# Prismix Website

React + Vite website for Prismix Studios, deployed on Netlify.

---

## Blog architecture

The blog system stores all posts in Netlify Blobs. There are two ways a post
can enter the system, and they share the same storage — neither path can erase
the other's data.

```
AI blog agent
  ├─ POST /api/blogs  ──────────────────────────► Netlify Blobs (posts.json)
  └─ post to LinkedIn ──► hourly sync ──────────► (merged into same store)

Company person
  └─ posts on LinkedIn ──► hourly sync ──────────► Netlify Blobs (posts.json)

Browser
  └─ GET /api/blogs ◄────────────────────────────── Netlify Blobs (posts.json)
```

**Rules that never change:**
- The browser only ever reads `/api/blogs`. It never talks to LinkedIn.
- LinkedIn is never scraped. The function calls the official LinkedIn Posts API.
- There are no webhooks.
- Agent-created posts are never erased or overwritten by a LinkedIn sync.

---

## How posts get into the system

### Path 1 — AI agent (rich content, arrives immediately)

The AI agent sends a fully-formed post directly to the website backend,
then separately publishes the same content to LinkedIn.

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

| Field         | Default when omitted                                                              |
|---------------|-----------------------------------------------------------------------------------|
| `excerpt`     | First 280 chars of body text                                                      |
| `publishedAt` | Current timestamp                                                                 |
| `image`       | `null`                                                                            |
| `linkedinUrl` | `null`                                                                            |
| `author`      | `{ name: "Prismix Studios", role: "AI Blog Agent", initials: "PS" }`             |
| `category`    | `"Prismix Journal"`                                                               |
| `tags`        | `[]`                                                                              |
| `pullQuote`   | First sentence of body, or excerpt if sentence is too short                       |

**Responses:**

| Status | Meaning                                                   |
|--------|-----------------------------------------------------------|
| `200`  | Post saved — body contains the normalized post JSON       |
| `400`  | Missing or invalid fields                                 |
| `401`  | Wrong or missing `Authorization: Bearer` header           |
| `500`  | `BLOG_INGEST_TOKEN` env var not configured on the server  |

### Path 2 — LinkedIn (imported, delayed by up to 1 hour)

A team member posts directly on the Prismix LinkedIn page.
The scheduled `sync-linkedin-blogs` function runs every hour, fetches all
recent posts from LinkedIn, and **merges** them into the existing Blobs data.

Posts already created by the AI agent are never overwritten.
If the LinkedIn post and an agent post share the same `linkedinUrl`, they are
collapsed into one record and the agent's richer content takes priority.

If the LinkedIn API call fails for any reason, `posts.json` is left untouched —
the frontend keeps serving the last good data.

---

## Deduplication rules

When a new post arrives (from either path), the merge logic checks for an
existing match using these rules, in order:

1. `id` matches
2. `linkedinUrl` matches (both must be non-null)
3. `source === "linkedin"` and `sourceId` matches (both must be non-null)

On a match, the records are merged. The `website-agent` version wins on
text fields (title, body, tags, image, etc.). Neither side can erase a
non-empty field with an empty/null value from the other.

---

## Environment variables

Set these in the Netlify dashboard under **Site settings → Environment variables**.

| Variable                | Required | Description                                                                  |
|-------------------------|----------|------------------------------------------------------------------------------|
| `BLOG_INGEST_TOKEN`     | Yes      | Secret token the AI agent sends in `Authorization: Bearer` when POSTing      |
| `LINKEDIN_ORG_URN`      | Yes      | Your LinkedIn organization URN, e.g. `urn:li:organization:12345678`          |
| `LINKEDIN_ACCESS_TOKEN` | Yes      | OAuth 2.0 access token with `r_organization_social` scope                   |
| `LINKEDIN_API_VERSION`  | No       | LinkedIn API version header (default: `202401`)                              |

**Token rotation:** LinkedIn access tokens expire (typically after 60 days).
Generate a new token and update `LINKEDIN_ACCESS_TOKEN` in the Netlify dashboard
before it expires. If the token expires, the LinkedIn sync will fail and log an
error in `sync-state.json` — existing posts in Blobs are not affected and the
blog page keeps working.

---

## File structure

```
netlify/
  functions/
    blogs.js                  ← GET + POST handler for /api/blogs
    sync-linkedin-blogs.js    ← Scheduled LinkedIn importer (runs @hourly)
    lib/
      postStore.js            ← Shared read / merge / write helpers

src/
  pages/Blogs.jsx             ← Blog page (reads from blogService)
  services/blogService.js     ← Fetches /api/blogs in prod, mock data in dev
  data/blogs.js               ← Mock posts used in local development
```

---

## Netlify functions

| Function                        | Route          | Trigger        |
|---------------------------------|----------------|----------------|
| `netlify/functions/blogs.js`    | `/api/blogs`   | On request (GET and POST) |
| `sync-linkedin-blogs.js`        | —              | Hourly schedule |

### Running the LinkedIn sync manually

In the Netlify dashboard: **Functions → sync-linkedin-blogs → Run now**.

Or via the Netlify CLI:
```bash
netlify functions:invoke sync-linkedin-blogs
```

---

## Local development

```bash
npm install
npm run dev     # http://localhost:5173
```

In development (`import.meta.env.PROD === false`), `blogService.js` returns
the mock posts from `src/data/blogs.js` — the Netlify Functions are not called.

To test functions locally, use `netlify dev` (requires the Netlify CLI).

---

## Build

```bash
npm run build   # outputs to dist/
npm run lint    # ESLint check
npm run preview # serve built output locally
```

Commits to the `main` branch trigger an automatic deploy on Netlify.
The `netlify.toml` redirects `/api/blogs` to the `blogs` function so both
GET and POST work through the same clean URL.
