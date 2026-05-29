/**
 * newsValidator.js — Input validation for Latest News items.
 *
 * Validates the *admin-supplied* fields of a NewsItem (title, image, link,
 * published). Internal fields (id, order, createdAt, updatedAt) are managed
 * server-side and do NOT need to be supplied by the admin app.
 *
 * NewsItem shape (canonical):
 *   {
 *     id:        string,   // server-generated, kebab-case slug of title
 *     title:     string,   // admin-supplied, 1..200 chars
 *     image:     string,   // admin-supplied, "/news1.png" OR "https://..."
 *     link:      string,   // admin-supplied, full http/https URL
 *     published: boolean,  // admin-supplied
 *     order:     number,   // server-managed, positive integer
 *     createdAt: string,   // server-set ISO timestamp
 *     updatedAt: string,   // server-set ISO timestamp
 *   }
 */

/**
 * Returns a string describing the first validation error, or null if the
 * input is acceptable. Used by POST (create) and PUT (update) handlers.
 *
 * @param {object}  body
 * @param {boolean} isUpdate — when true, allows omitted fields (PATCH-style).
 */
export function validateNewsInput(body, isUpdate) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }

  // ── title ──
  if (!isUpdate || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return 'Missing required field: "title" (non-empty string)';
    }
    if (body.title.trim().length > 200) {
      return '"title" must be 200 characters or fewer';
    }
  }

  // ── image ── (a public site path like "/news1.png" or a full http/https URL)
  if (!isUpdate || body.image !== undefined) {
    if (typeof body.image !== "string" || !body.image.trim()) {
      return 'Missing required field: "image" (non-empty string)';
    }
    if (body.image.length > 2048) {
      return '"image" must be 2048 characters or fewer';
    }
    if (!isImageValue(body.image)) {
      return '"image" must be a site path beginning with "/" or a full http/https URL';
    }
  }

  // ── link ── (always a full http/https URL)
  if (!isUpdate || body.link !== undefined) {
    if (typeof body.link !== "string" || !body.link.trim()) {
      return 'Missing required field: "link" (non-empty URL)';
    }
    if (body.link.length > 2048) {
      return '"link" must be 2048 characters or fewer';
    }
    if (!isHttpUrl(body.link)) {
      return '"link" must be a valid http or https URL';
    }
  }

  // ── published ── (optional on create; defaults to true)
  if (body.published !== undefined && typeof body.published !== "boolean") {
    return '"published" must be a boolean';
  }

  return null;
}

/** Allow either a site path starting with "/" or a full http(s) URL. */
function isImageValue(s) {
  if (s.startsWith("/")) return true;
  return isHttpUrl(s);
}

/** Strict http(s) URL test. */
function isHttpUrl(s) {
  try {
    var u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Convert a title into a stable kebab-case id slug, trimmed to a sensible
 * maximum length. If the input is empty after sanitising, falls back to a
 * timestamped id so we never produce an empty string.
 */
export function slugifyTitle(title) {
  var base = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (base.length === 0) {
    base = "news-" + Date.now();
  }
  return base;
}

/**
 * Ensures the proposed id is not already in `existingIds`. If it is, appends
 * "-2", "-3", … until a free slot is found.
 */
export function uniquify(id, existingIds) {
  if (!existingIds.includes(id)) return id;
  var i = 2;
  while (existingIds.includes(id + "-" + i)) {
    i += 1;
  }
  return id + "-" + i;
}
