/**
 * Published CMS content for the public site.
 *
 * One module-level copy of the current release is shared by every page. It is seeded from sessionStorage (keyed by the release checksum) so that a visitor who already loaded it in this tab
 * sees the CMS page on first paint, and it is revalidated against /cms-api/release with If-None-Match at most every 60 s and whenever the window gains focus. The request has a short timeout.
 * Nothing here ever throws to the caller: on any failure the last known copy is kept (or none), and the gate falls back to the built-in page.
 *
 * Kill switches: `?cms=off` in the URL (remembered in localStorage until `?cms=on`) and the build flag REACT_APP_CMS_PUBLISHED=0.
 */
const POINTER = "cygen-cms-release";
const PREFIX = "cygen-cms-release:";
const FLAG = "cygen-cms";
const TIMEOUT_MS = 2500;
const REVALIDATE_MS = 60000;

let release = null; // { number, checksum, content }
let seeded = false;
let lastCheck = 0;
let inflight = null;
let started = false;
const listeners = new Set();

export function cmsPublishedEnabled() {
  if (process.env.REACT_APP_CMS_PUBLISHED === "0") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("cms");
    if (q === "off") window.localStorage.setItem(FLAG, "off");
    else if (q === "on") window.localStorage.removeItem(FLAG);
    return window.localStorage.getItem(FLAG) !== "off";
  } catch (e) {
    return true;
  }
}

function readStored() {
  try {
    const sum = window.sessionStorage.getItem(POINTER);
    if (!sum) return null;
    const raw = window.sessionStorage.getItem(PREFIX + sum);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeStored(rel) {
  try {
    const old = window.sessionStorage.getItem(POINTER);
    if (old && (!rel || old !== rel.checksum)) window.sessionStorage.removeItem(PREFIX + old);
    if (rel) {
      window.sessionStorage.setItem(PREFIX + rel.checksum, JSON.stringify(rel));
      window.sessionStorage.setItem(POINTER, rel.checksum);
    } else {
      window.sessionStorage.removeItem(POINTER);
    }
  } catch (e) {
    /* private window or full storage: the in-memory copy still works */
  }
}

function set(next) {
  if ((release && release.checksum) === (next && next.checksum)) return;
  release = next;
  writeStored(next);
  listeners.forEach((fn) => fn());
}

function valid(body) {
  return body && typeof body === "object" && body.content && Array.isArray(body.content.pages) && typeof body.checksum === "string";
}

/** The current release as known right now (memory, else this tab's stored copy), or null. Never waits for the network. */
export function getRelease() {
  if (!seeded) {
    seeded = true;
    release = readStored();
  }
  return release;
}

/** Revalidates against the API (at most every 60 s unless forced). Resolves in all cases. */
export function refreshRelease(force = false) {
  getRelease();
  const now = Date.now();
  if (inflight) return inflight;
  if (!force && lastCheck && now - lastCheck < REVALIDATE_MS) return Promise.resolve();
  lastCheck = now;
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = setTimeout(() => ctl && ctl.abort(), TIMEOUT_MS);
  const headers = { Accept: "application/json" };
  if (release) headers["If-None-Match"] = `"${release.checksum}"`;
  inflight = fetch("/cms-api/release", { headers, signal: ctl ? ctl.signal : undefined })
    .then(async (r) => {
      if (r.status === 304) return;
      if (r.status === 404) {
        set(null); // nothing is published: every page is the built-in one
        return;
      }
      if (!r.ok) return; // keep what we have
      const body = await r.json();
      if (valid(body)) set({ number: body.number, checksum: body.checksum, content: body.content });
    })
    .catch(() => {
      /* offline, slow or blocked: keep the last known copy, or none */
    })
    .then(() => {
      clearTimeout(timer);
      inflight = null;
    });
  return inflight;
}

/** Subscribes a component to release changes; starts the focus revalidation once. Returns the unsubscribe function. */
export function subscribeRelease(fn) {
  listeners.add(fn);
  if (!started) {
    started = true;
    window.addEventListener("focus", () => refreshRelease());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshRelease();
    });
  }
  return () => listeners.delete(fn);
}

export function findPage(rel, slug) {
  const pages = (rel && rel.content && rel.content.pages) || [];
  return pages.find((p) => (p.slug || "") === (slug || "")) || null;
}

export function mediaUrl(rel, id) {
  const m = rel && rel.content && rel.content.media && rel.content.media[id];
  return m && m.path ? `/cms-media/${String(m.path).replace(/^\/media\//, "")}` : "";
}
