# LinkedIn Post Fetcher — INTEGRATED

> **This module has been integrated into the main `prismix-website` project.**
> The files here are kept for reference only. Use the versions in:
> - `prismix-website/netlify/functions/blogs.js`
> - `prismix-website/netlify/functions/sync-linkedin-blogs.js`
> - `prismix-website/netlify.toml`

For setup and deployment instructions, see the main [`README.md`](../README.md).

---

## Architecture

```
LinkedIn company page
  └─ sync-linkedin-blogs (Netlify scheduled function, runs @hourly)
       └─ writes posts.json to Netlify Blobs
            └─ blogs (Netlify function, GET /api/blogs)
                 └─ /blogs page in the browser
```

- **No webhooks.** LinkedIn does not provide a useful webhook for new company-page posts.
- **Scheduled polling only.** Updates happen on the hourly Netlify schedule.
- The browser never calls LinkedIn directly.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `LINKEDIN_ORG_URN` | Yes | e.g. `urn:li:organization:12345678` |
| `LINKEDIN_ACCESS_TOKEN` | Yes | OAuth 2.0 token with `r_organization_social` scope |
| `LINKEDIN_API_VERSION` | No | Defaults to `202401` |

**Access token expiry:** LinkedIn tokens expire and must be rotated manually in the Netlify dashboard.
