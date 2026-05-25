# Next Steps — GitHub posts.json Trial Setup

Everything you need to do to get the new GitHub-backed blog architecture live.

---

## Step 1 — Push the code changes to GitHub

`data/posts.json` must exist in the repo before anything works. Make sure these
new/changed files are committed and pushed:

```
data/posts.json                              ← new (seed posts)
netlify/functions/lib/githubPostStore.js     ← new
netlify/functions/lib/postStore.js           ← updated
netlify/functions/blogs.js                   ← updated
netlify/functions/sync-linkedin-blogs.js     ← updated
src/services/blogService.js                  ← updated
README.md                                    ← updated
.env                                         ← updated (do NOT commit this)
```

---

## Step 2 — Create a GitHub Personal Access Token

This is what lets the Netlify Function write to `data/posts.json` on your behalf.

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set:
   - **Token name:** `prismix-blog-writer`
   - **Expiration:** your choice (90 days minimum recommended — set a calendar reminder to rotate it)
   - **Repository access:** Only select repositories → pick your prismix repo
   - **Permissions → Repository permissions → Contents:** `Read and write`
4. Click **Generate token** and **copy it immediately** — GitHub will not show it again

This token is the value for `GITHUB_TOKEN`.

---

## Step 3 — Set environment variables in the Netlify dashboard

Go to **Netlify → your site → Site settings → Environment variables** and add the following.

### Server-side variables (never sent to the browser)

| Variable             | Value                                   | Notes                                                                 |
|----------------------|-----------------------------------------|-----------------------------------------------------------------------|
| `BLOG_INGEST_TOKEN`  | a long random secret string             | The agent sends this. Generate one with `openssl rand -hex 32`        |
| `GITHUB_TOKEN`       | the token from Step 2                   | Never expose this in frontend code                                    |
| `GITHUB_OWNER`       | your GitHub username or org             | e.g. `prismixstudios`                                                 |
| `GITHUB_REPO`        | your repository name                    | e.g. `prismix-website`                                                |
| `GITHUB_BRANCH`      | `main`                                  | or `master` — whatever your default branch is called                  |
| `GITHUB_POSTS_PATH`  | `data/posts.json`                       | leave as-is unless you moved the file                                 |

### Build-time variable (embedded into the frontend JS bundle)

| Variable              | Value                                                                             | Notes                                        |
|-----------------------|-----------------------------------------------------------------------------------|----------------------------------------------|
| `VITE_BLOGS_JSON_URL` | `https://raw.githubusercontent.com/<owner>/<repo>/main/data/posts.json`          | Replace `<owner>` and `<repo>` with real values. This is public — do not put secrets here. |

---

## Step 4 — Trigger a new Netlify deploy

After adding the env vars you must **redeploy** so `VITE_BLOGS_JSON_URL` gets
baked into the frontend bundle. Without this step the Blogs page will not know
where to fetch posts from.

**Netlify → Deploys → Trigger deploy → Deploy site**

---

## Step 5 — Test it end-to-end

### POST a test post to your live site

```bash
curl -X POST https://<your-netlify-site>/api/blogs \
  -H "Authorization: Bearer <your-BLOG_INGEST_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test post from agent",
    "body": ["This is a test paragraph.", "Second paragraph here."]
  }'
```

A `200` response with the normalised post JSON means the write succeeded.

### Verify the full chain

1. Open your GitHub repo → `data/posts.json` — the test post should be in the array
2. The commit message should read `chore: update blog posts [skip netlify]`
3. Check the Netlify dashboard under **Deploys** — no new deploy should have started
4. Wait up to 5 minutes, then visit `/blogs` on your live site — the new post should appear

---

## Local development setup

Fill in `.env` with real values if you want agent POSTs to actually write to
GitHub from your local machine (`npm run serve`):

```env
BLOG_INGEST_TOKEN=dev-secret
GITHUB_TOKEN=<your token from Step 2>
GITHUB_OWNER=<your github username or org>
GITHUB_REPO=<your repo name>
GITHUB_BRANCH=main
GITHUB_POSTS_PATH=data/posts.json
VITE_BLOGS_JSON_URL=https://raw.githubusercontent.com/<owner>/<repo>/main/data/posts.json
```

If you only need to work on the UI without touching GitHub, `npm run dev` is
enough — it falls back to the static posts in `src/data/blogs.js` automatically.
