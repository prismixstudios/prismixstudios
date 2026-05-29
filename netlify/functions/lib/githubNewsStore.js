/**
 * githubNewsStore.js — GitHub Contents API storage helper for Latest News.
 *
 * Mirrors githubPostStore.js but targets a different file (default
 * `data/latest-news.json`) and uses its own optional env override
 * (GITHUB_NEWS_PATH).
 *
 * How it works:
 *   - Reads  data/latest-news.json  via  GET  /repos/{owner}/{repo}/contents/{path}
 *   - Writes data/latest-news.json  via  PUT  /repos/{owner}/{repo}/contents/{path}
 *   - Every write commits with "[skip netlify]" so admin edits do NOT trigger
 *     a website rebuild. The public reader picks up the change once the GitHub
 *     raw CDN cache expires (~5 minutes).
 *
 * Required Netlify env vars:
 *   GITHUB_TOKEN  — personal access token with `contents: write` on the repo
 *   GITHUB_OWNER  — GitHub user/org owning the repository
 *   GITHUB_REPO   — repository name
 *
 * Optional env vars (defaults provided):
 *   GITHUB_BRANCH      — branch to read/write          (default: "main")
 *   GITHUB_NEWS_PATH   — JSON file path inside the repo (default: "data/latest-news.json")
 */

var GITHUB_API = "https://api.github.com";

// Default commit message — keep the [skip netlify] tag so news edits do not
// re-deploy the entire site every time.
var COMMIT_MESSAGE = "chore: update latest news [skip netlify]";

// ─── Internal config loader ───────────────────────────────────────────────────

/**
 * Reads and validates the GitHub env config used for news writes.
 * Throws a descriptive Error if a required variable is missing so the calling
 * Netlify Function can surface a 500 instead of issuing a useless API call.
 */
function getConfig() {
  var token  = process.env.GITHUB_TOKEN;
  var owner  = process.env.GITHUB_OWNER;
  var repo   = process.env.GITHUB_REPO;
  var branch = process.env.GITHUB_BRANCH     ?? "main";
  var path   = process.env.GITHUB_NEWS_PATH  ?? "data/latest-news.json";

  if (!token || !owner || !repo) {
    throw new Error(
      "Missing required GitHub env vars: GITHUB_TOKEN, GITHUB_OWNER, and/or GITHUB_REPO"
    );
  }
  return { token, owner, repo, branch, path };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches latest-news.json from GitHub and returns { items, sha }.
 *
 * - items: the parsed array (or [] if the file is missing or malformed).
 * - sha:   the file SHA, required when the caller wants to overwrite the file
 *          via writeNewsToGitHub(). null when the file does not exist yet so
 *          a first write can create it.
 *
 * Returns gracefully on 404 so a fresh repo can be bootstrapped by the first
 * admin POST. Throws on any other non-2xx response so callers see the error.
 */
export async function readNewsFromGitHub() {
  var { token, owner, repo, branch, path } = getConfig();

  var url = GITHUB_API + "/repos/" + owner + "/" + repo
          + "/contents/" + path + "?ref=" + branch;

  var res = await fetch(url, {
    headers: {
      "Authorization":        "Bearer " + token,
      "Accept":               "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  // File not found — return an empty state so the first write creates it.
  if (res.status === 404) {
    return { items: [], sha: null };
  }

  if (!res.ok) {
    var errBody = await res.text();
    throw new Error("GitHub read failed (" + res.status + "): " + errBody);
  }

  var data    = await res.json();
  var rawJson = Buffer.from(data.content, "base64").toString("utf8");

  var items;
  try {
    items = JSON.parse(rawJson);
  } catch {
    // File exists but is not valid JSON — treat as empty so we self-heal on
    // the next write rather than locking the admin out.
    items = [];
  }

  return {
    items: Array.isArray(items) ? items : [],
    sha:   data.sha,
  };
}

/**
 * Overwrites latest-news.json on GitHub with the given items array.
 *
 * @param {Array}       items — full canonical news array to persist.
 * @param {string|null} sha   — the SHA returned by the most recent read.
 *                              Pass null only when creating the file for the
 *                              first time.
 *
 * Throws if GitHub returns a non-2xx status. The caller (admin function)
 * already retries on 409 conflict, so a thrown error here means the write
 * truly failed.
 */
export async function writeNewsToGitHub(items, sha) {
  var { token, owner, repo, branch, path } = getConfig();

  // GitHub Contents API requires file content as base64-encoded UTF-8.
  var json    = JSON.stringify(items, null, 2);
  var content = Buffer.from(json, "utf8").toString("base64");

  var putBody = {
    message: COMMIT_MESSAGE,
    content: content,
    branch:  branch,
  };

  // SHA is mandatory when updating; omit it only on first-time create.
  if (sha) {
    putBody.sha = sha;
  }

  var url = GITHUB_API + "/repos/" + owner + "/" + repo + "/contents/" + path;

  var res = await fetch(url, {
    method:  "PUT",
    headers: {
      "Authorization":        "Bearer " + token,
      "Accept":               "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type":         "application/json",
    },
    body: JSON.stringify(putBody),
  });

  if (!res.ok) {
    var errBody = await res.text();
    var err = new Error("GitHub write failed (" + res.status + "): " + errBody);
    err.status = res.status;
    throw err;
  }

  return await res.json();
}
