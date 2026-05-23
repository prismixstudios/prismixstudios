import { getStore } from "@netlify/blobs";

/**
 * GET /.netlify/functions/blogs  (or /api/blogs via redirect)
 * Returns the cached posts.json written by sync-linkedin-blogs.
 * Always returns 200 — an empty array if the cache hasn't been
 * populated yet, rather than a 500 that would break the page.
 */
export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const store = getStore({ name: "blogs", consistency: "strong" });
    const posts = await store.get("posts.json", { type: "json" });

    return new Response(JSON.stringify(posts ?? []), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // CDN caches for 5 min; serves stale for up to 10 min while revalidating
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[blogs] Blob read error:", err.message);
    // Return empty array so the page still renders
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
