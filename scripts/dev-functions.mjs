/**
 * dev-functions.mjs
 *
 * Minimal local dev server for Netlify Functions — no CLI required.
 * Runs on port 9999 and serves the blogs function at /api/blogs.
 *
 * Vite proxies /api/* to this server (see vite.config.js).
 * postStore.js detects NETLIFY_DEV=true and uses a local JSON file
 * instead of Netlify Blobs, so no Netlify login is needed.
 *
 * Start via: npm run serve
 */

import { createServer } from "node:http";

// Must be set before the dynamic import so postStore.js sees it at load time
process.env.NETLIFY_DEV = "true";

const PORT = 9999;

// Dynamic import so env vars above are set before postStore.js evaluates IS_LOCAL
const { default: blogsHandler } = await import("../netlify/functions/blogs.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function toWebRequest(nodeReq) {
  const url = `http://localhost:${PORT}${nodeReq.url}`;
  const chunks = [];
  for await (const chunk of nodeReq) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  return new Request(url, {
    method:  nodeReq.method,
    headers: nodeReq.headers,
    body:    body.length > 0 ? body : null,
  });
}

async function writeWebResponse(webRes, nodeRes) {
  const headers = {};
  webRes.headers.forEach((val, key) => { headers[key] = val; });
  const body = await webRes.arrayBuffer();
  nodeRes.writeHead(webRes.status, headers);
  nodeRes.end(Buffer.from(body));
}

// ─── Server ───────────────────────────────────────────────────────────────────

createServer(async (nodeReq, nodeRes) => {
  const url = nodeReq.url ?? "/";

  // CORS preflight
  if (nodeReq.method === "OPTIONS") {
    nodeRes.writeHead(204, {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    nodeRes.end();
    return;
  }

  if (url.startsWith("/api/blogs") || url.startsWith("/.netlify/functions/blogs")) {
    try {
      const webReq = await toWebRequest(nodeReq);
      const webRes = await blogsHandler(webReq);
      await writeWebResponse(webRes, nodeRes);
    } catch (err) {
      console.error("[dev-functions] Unhandled error:", err);
      nodeRes.writeHead(500, { "Content-Type": "text/plain" });
      nodeRes.end("Internal Server Error");
    }
    return;
  }

  nodeRes.writeHead(404, { "Content-Type": "text/plain" });
  nodeRes.end("Not found");

}).listen(PORT, "0.0.0.0", () => {
  console.log(`[dev-functions] ready at http://localhost:${PORT}`);
  console.log(`[dev-functions] POST/GET http://localhost:${PORT}/api/blogs`);
});
