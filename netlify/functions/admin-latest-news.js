/**
 * admin-latest-news.js — Netlify Function (admin / protected).
 *
 * Single function that handles the full CRUD + reorder API for Latest News.
 *
 * Authentication
 *   All requests must send:
 *     Authorization: Bearer <NEWS_ADMIN_TOKEN>
 *   NEWS_ADMIN_TOKEN is a Netlify environment variable. It is a SEPARATE
 *   token from BLOG_INGEST_TOKEN — admins may rotate it independently.
 *
 * Routes (proxied via netlify.toml)
 *   GET    /api/admin/latest-news           → list ALL items (incl. drafts)
 *   POST   /api/admin/latest-news           → create one item
 *   PUT    /api/admin/latest-news/reorder   → bulk reorder (body: { order: ["id1","id2",…] })
 *   PUT    /api/admin/latest-news/:id       → partial update of one item
 *   DELETE /api/admin/latest-news/:id       → delete one item
 *
 * Concurrency
 *   Writes use optimistic concurrency via the GitHub file SHA. On a 409
 *   (concurrent edit landed first) we re-read and retry up to 2 times.
 *
 * Error model
 *   400 — bad input
 *   401 — missing/invalid auth
 *   404 — item id not found / unknown route
 *   405 — wrong HTTP verb for the matched route
 *   500 — server misconfiguration or unexpected error
 */

import { readNewsFromGitHub, writeNewsToGitHub } from "./lib/githubNewsStore.js";
import { validateNewsInput, slugifyTitle, uniquify } from "./lib/newsValidator.js";

// Max attempts for the write-retry loop on GitHub 409 conflicts.
const MAX_RETRIES = 2;

// ─── Entry point ─────────────────────────────────────────────────────────────

export default async function handler(req) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    var token = process.env.NEWS_ADMIN_TOKEN;
    if (!token) {
      console.error("[admin-latest-news] NEWS_ADMIN_TOKEN is not set");
      return jsonError(500, "Server misconfiguration");
    }
    var authHeader = req.headers.get("authorization") ?? "";
    if (authHeader !== "Bearer " + token) {
      return jsonError(401, "Unauthorized");
    }

    // ── Route dispatch ──────────────────────────────────────────────────────
    // Netlify strips the /api/admin/latest-news prefix and the function path,
    // but we cannot rely on that because the path the function sees depends
    // on how the request hit it (direct /.netlify/functions/... vs /api/...).
    // We therefore look at the tail of req.url, after the function name.
    var route = extractRoute(req.url);

    if (route.kind === "collection") {
      if (req.method === "GET")  return await handleList();
      if (req.method === "POST") return await handleCreate(req);
      return jsonError(405, "Method Not Allowed");
    }

    if (route.kind === "reorder") {
      if (req.method === "PUT") return await handleReorder(req);
      return jsonError(405, "Method Not Allowed");
    }

    if (route.kind === "item") {
      if (req.method === "PUT")    return await handleUpdate(req, route.id);
      if (req.method === "DELETE") return await handleDelete(route.id);
      return jsonError(405, "Method Not Allowed");
    }

    return jsonError(404, "Not Found");
  } catch (err) {
    console.error("[admin-latest-news] unhandled error:", err.message);
    return jsonError(500, "Internal Server Error");
  }
}

// ─── Route parsing ──────────────────────────────────────────────────────────

/**
 * Parses the request URL into one of three route shapes:
 *
 *   { kind: "collection" }              ← /api/admin/latest-news (or function root)
 *   { kind: "reorder" }                 ← /api/admin/latest-news/reorder
 *   { kind: "item", id: "<slug>" }      ← /api/admin/latest-news/<id>
 *
 * Both the proxied (/api/admin/latest-news/...) and direct
 * (/.netlify/functions/admin-latest-news/...) URLs are handled by stripping
 * everything up to and including the function/route prefix.
 */
function extractRoute(rawUrl) {
  var pathname;
  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    pathname = rawUrl;
  }

  // Trim both possible prefixes
  var stripped = pathname
    .replace(/^\/?\.netlify\/functions\/admin-latest-news/, "")
    .replace(/^\/?api\/admin\/latest-news/, "")
    .replace(/^\/+/, "");

  if (stripped === "" || stripped === "/") {
    return { kind: "collection" };
  }
  if (stripped === "reorder") {
    return { kind: "reorder" };
  }
  // First path segment is the id; ignore anything after it (defensive).
  var id = stripped.split("/")[0];
  return { kind: "item", id: decodeURIComponent(id) };
}

// ─── Handlers ───────────────────────────────────────────────────────────────

/** GET /api/admin/latest-news — list ALL items (including drafts). */
async function handleList() {
  var { items } = await readNewsFromGitHub();
  var sorted = sortByOrder(items);
  return jsonResponse(200, sorted);
}

/** POST /api/admin/latest-news — create a new item. */
async function handleCreate(req) {
  var body = await readJsonBody(req);
  if (body.error) return body.error;

  var validationError = validateNewsInput(body.value, /* isUpdate */ false);
  if (validationError) return jsonError(400, validationError);

  return await mutateWithRetry(function (items) {
    var existingIds = items.map(function (n) { return n.id; });
    var baseId      = slugifyTitle(body.value.title);
    var id          = uniquify(baseId, existingIds);
    var now         = new Date().toISOString();

    // Assign a provisional order higher than all existing items so the new
    // card sorts last, then renumber everything 1..N to close any prior gaps.
    var maxOrder = 0;
    for (var i = 0; i < items.length; i++) {
      if (typeof items[i].order === "number" && items[i].order > maxOrder) {
        maxOrder = items[i].order;
      }
    }

    var item = {
      id:        id,
      title:     body.value.title.trim(),
      image:     body.value.image.trim(),
      link:      body.value.link.trim(),
      published: body.value.published !== false, // default true
      order:     maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    items.push(item);
    var renumbered = renumberItems(items, now);
    var created = renumbered.find(function (n) { return n.id === id; });
    return { items: renumbered, payload: created };
  });
}

/** PUT /api/admin/latest-news/:id — partial update. */
async function handleUpdate(req, id) {
  var body = await readJsonBody(req);
  if (body.error) return body.error;

  var validationError = validateNewsInput(body.value, /* isUpdate */ true);
  if (validationError) return jsonError(400, validationError);

  return await mutateWithRetry(function (items) {
    var idx = items.findIndex(function (n) { return n.id === id; });
    if (idx === -1) {
      return { error: jsonError(404, 'No news item with id "' + id + '"') };
    }
    var prev = items[idx];
    var updated = {
      ...prev,
      title:     body.value.title     !== undefined ? body.value.title.trim()     : prev.title,
      image:     body.value.image     !== undefined ? body.value.image.trim()     : prev.image,
      link:      body.value.link      !== undefined ? body.value.link.trim()      : prev.link,
      published: body.value.published !== undefined ? body.value.published        : prev.published,
      updatedAt: new Date().toISOString(),
    };
    items[idx] = updated;
    return { items: items, payload: updated };
  });
}

/** DELETE /api/admin/latest-news/:id — remove one item and renumber survivors
 *  1..N so order values always form a gapless sequence. */
async function handleDelete(id) {
  return await mutateWithRetry(function (items) {
    var before = items.length;
    var next   = items.filter(function (n) { return n.id !== id; });
    if (next.length === before) {
      return { error: jsonError(404, 'No news item with id "' + id + '"') };
    }
    var renumbered = renumberItems(next, new Date().toISOString());
    return { items: renumbered, payload: { deleted: id } };
  });
}

/**
 * PUT /api/admin/latest-news/reorder — bulk reorder.
 *
 * Body shape:
 *   { "order": ["id-a", "id-b", "id-c"] }
 *
 * Items listed in `order` are renumbered 1..N in the order they appear.
 * Any items not in the list keep their existing order (placed after the
 * listed ones). Unknown ids in `order` are ignored.
 */
async function handleReorder(req) {
  var body = await readJsonBody(req);
  if (body.error) return body.error;
  var payload = body.value;

  if (!payload || !Array.isArray(payload.order)) {
    return jsonError(400, '"order" must be an array of news item ids');
  }
  if (!payload.order.every(function (x) { return typeof x === "string"; })) {
    return jsonError(400, '"order" must contain only string ids');
  }

  return await mutateWithRetry(function (items) {
    var idToItem = new Map();
    items.forEach(function (it) { idToItem.set(it.id, it); });

    var listed   = [];
    var seen     = new Set();
    payload.order.forEach(function (id) {
      var it = idToItem.get(id);
      if (it && !seen.has(id)) {
        listed.push(it);
        seen.add(id);
      }
    });
    var rest = items.filter(function (it) { return !seen.has(it.id); });

    var combined = listed.concat(rest);
    var now = new Date().toISOString();
    combined = combined.map(function (it, i) {
      // Only bump updatedAt when the order actually changed
      var newOrder = i + 1;
      if (it.order === newOrder) return it;
      return { ...it, order: newOrder, updatedAt: now };
    });

    return { items: combined, payload: sortByOrder(combined) };
  });
}

// ─── Mutation helper (read → mutate → write with retry on 409) ──────────────

/**
 * mutate :: (items) => { items, payload }  OR  { error: Response }
 *
 * Reads latest-news.json, runs `mutate`, writes the result back. If GitHub
 * responds 409 (concurrent edit), the read+mutate+write cycle is retried up
 * to MAX_RETRIES times with a short backoff. Returns the JSON response
 * carrying `payload`, or whatever Error `mutate` produced.
 */
async function mutateWithRetry(mutate) {
  var attempt = 0;
  while (true) {
    var { items, sha } = await readNewsFromGitHub();
    var result;
    try {
      result = mutate(items);
    } catch (err) {
      console.error("[admin-latest-news] mutate error:", err.message);
      return jsonError(500, "Mutation failed");
    }
    if (result.error) return result.error;

    try {
      await writeNewsToGitHub(result.items, sha);
      return jsonResponse(200, result.payload);
    } catch (err) {
      var isConflict = err.status === 409 || err.status === 422;
      if (isConflict && attempt < MAX_RETRIES) {
        attempt += 1;
        await sleep(200 * attempt);
        continue;
      }
      console.error("[admin-latest-news] write failed:", err.message);
      return jsonError(500, "Failed to persist news update");
    }
  }
}

// ─── Tiny response/request helpers ──────────────────────────────────────────

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type":                "application/json",
      "Cache-Control":               "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: {
      "Content-Type":                "application/json",
      "Cache-Control":               "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function readJsonBody(req) {
  try {
    var value = await req.json();
    return { value };
  } catch {
    return { error: jsonError(400, "Invalid JSON body") };
  }
}

function sortByOrder(items) {
  return items.slice().sort(function (a, b) {
    var ao = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
    var bo = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });
}

/** Sort items by current order and assign fresh 1-based integers so the
 *  sequence is always gapless. Items whose order is already correct are
 *  returned as-is (no updatedAt bump). */
function renumberItems(items, now) {
  var sorted = sortByOrder(items);
  return sorted.map(function (it, i) {
    var newOrder = i + 1;
    if (it.order === newOrder) return it;
    return { ...it, order: newOrder, updatedAt: now };
  });
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}
