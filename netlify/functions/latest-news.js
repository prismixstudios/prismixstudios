/**
 * latest-news.js — Netlify Function (public).
 *
 * Mounted at /.netlify/functions/latest-news, proxied as /api/latest-news.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  GET /api/latest-news                                                 │
 * │    Returns only published items, sorted ascending by `order`.         │
 * │    No authentication. Cache-Control: public, max-age=60.              │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Notes:
 *   - This is a convenience endpoint. The website's Home page actually
 *     fetches the raw GitHub URL (VITE_NEWS_JSON_URL) directly to avoid
 *     spending Netlify Function invocations on every visitor page load.
 *     This endpoint stays useful for:
 *       1. Debugging the live JSON via curl
 *       2. The admin app's "test connection" check
 *       3. Any future server-side renderer / preview tool
 */

import { readNewsFromGitHub } from "./lib/githubNewsStore.js";

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    var { items } = await readNewsFromGitHub();

    // Public view: hide drafts and sort by order ascending so card 1, 2, 3
    // appear in the order the admin set.
    var visible = items
      .filter(function (n) { return n && n.published !== false; })
      .sort(function (a, b) {
        var ao = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
        var bo = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
        return ao - bo;
      });

    return new Response(JSON.stringify(visible), {
      status: 200,
      headers: {
        "Content-Type":                "application/json",
        // 60 s edge cache — admin updates appear within a minute without
        // hammering the Function on every visitor request.
        "Cache-Control":               "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    // Never include the GitHub token (or any other secret) in the response.
    console.error("[latest-news] read failed:", err.message);
    return new Response("Internal Server Error", { status: 500 });
  }
}
