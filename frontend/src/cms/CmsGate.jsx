import React, { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { useLocation } from "react-router-dom";
import { SITE_URL, switchLocalePath } from "../lib/links";
import { upsertMeta, upsertLink } from "../components/Seo";
import { CmsSections } from "./sections";
import { cmsPublishedEnabled, findPage, getRelease, mediaUrl, refreshRelease, subscribeRelease } from "./release";

/**
 * Two modes. With a preview link (below) the draft is shown. Without one, the PUBLISHED release is used (PublishedGate, further down): the built-in page is drawn at once and is replaced by the
 * CMS version only when the current release contains this page; the release comes from release.js (cached for the tab, revalidated, short timeout) and any failure leaves the built-in page.
 *
 * Preview of unpublished drafts. The editor opens the site with ?cms_preview=<signed link>; the link is kept for this tab (sessionStorage) so moving around the site keeps the preview, and the
 * draft comes from the CYGEN API through the site's own address (/cms-api, no cross-site request). A page that is not part of the preview shows the site as it is. Without a link nothing here runs.
 */
const KEY = "cygen-cms-preview";

function readToken() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("cms_preview");
    if (fromUrl) {
      window.sessionStorage.setItem(KEY, fromUrl);
      return fromUrl;
    }
    return window.sessionStorage.getItem(KEY) || "";
  } catch (e) {
    return "";
  }
}

function exitPreview() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch (e) {
    /* private window */
  }
  window.location.href = window.location.pathname;
}

function Bar({ text }) {
  return (
    <div
      role="status"
      data-testid="cms-preview-bar"
      style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, background: "#c9503a", color: "#fff", font: "600 11px/1.2 ui-monospace, monospace", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 12px", textAlign: "center" }}
    >
      {text}{" "}
      <button type="button" onClick={exitPreview} style={{ background: "none", border: 0, color: "inherit", font: "inherit", textDecoration: "underline", cursor: "pointer", letterSpacing: "inherit", textTransform: "inherit" }}>
        Exit preview
      </button>
    </div>
  );
}

function PreviewGate({ slug, token, children }) {
  const { lang } = useI18n();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    fetch(`/cms-api/preview?token=${encodeURIComponent(token)}`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((bundle) => alive && setState({ status: "ready", bundle }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <>
        <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-dim">Preparing the preview…</div>
        <Bar text="Preview — loading the draft" />
      </>
    );
  }
  if (state.status === "error") {
    return (
      <>
        {children}
        <Bar text="Preview — this link is not valid or has expired" />
      </>
    );
  }
  const page = (state.bundle.pages || []).find((p) => p.slug === slug);
  if (!page) {
    return (
      <>
        {children}
        <Bar text="Preview — this page is not part of the draft, showing the live page" />
      </>
    );
  }
  return (
    <>
      <CmsSections page={page} media={state.bundle.media} lang={lang} />
      <Bar text="Preview — showing unpublished drafts" />
    </>
  );
}

const DESCRIPTION_AT_LOAD = (() => {
  try {
    const el = document.head.querySelector('meta[name="description"]');
    return el ? el.getAttribute("content") || "" : "";
  } catch (e) {
    return "";
  }
})();

const pick = (v, lang) => (v && typeof v === "object" ? v[lang] || v.en || "" : typeof v === "string" ? v : "");

function useRelease() {
  const [rel, setRel] = useState(getRelease);
  useEffect(() => {
    const off = subscribeRelease(() => setRel(getRelease()));
    setRel(getRelease());
    refreshRelease();
    return off;
  }, []);
  return rel;
}

/** The website icon from the published identity; the built-in icons come back when none is set. */
function useFavicon(rel) {
  const id = rel && rel.content && rel.content.identity && rel.content.identity.favicon;
  const href = id ? mediaUrl(rel, id) : "";
  useEffect(() => {
    const links = Array.from(document.head.querySelectorAll('link[rel="icon"]'));
    links.forEach((el) => {
      if (el.dataset.cmsOrig === undefined) el.dataset.cmsOrig = JSON.stringify({ href: el.getAttribute("href"), type: el.getAttribute("type") });
      const orig = JSON.parse(el.dataset.cmsOrig);
      if (href) {
        el.setAttribute("href", href);
        el.removeAttribute("type");
      } else {
        el.setAttribute("href", orig.href);
        if (orig.type) el.setAttribute("type", orig.type);
      }
    });
  }, [href]);
}

/** Title, description, canonical, share tags and robots of a CMS page; empty fields fall back to the page title and the site's default description. */
function usePageSeo(page, rel, lang) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!page) return undefined;
    const seo = page.seo || {};
    const title = pick(seo.title, lang) || pick(page.title, lang);
    const description = pick(seo.description, lang) || DESCRIPTION_AT_LOAD;
    const shareTitle = pick(seo.og_title, lang) || title;
    const shareText = pick(seo.og_description, lang) || description;
    const url = seo.canonical || `${SITE_URL}${pathname}`;
    if (title) document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", shareTitle);
    upsertMeta("property", "og:description", shareText);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:locale", lang === "es" ? "es_ES" : "en_US");
    upsertMeta("name", "twitter:title", shareTitle);
    upsertMeta("name", "twitter:description", shareText);
    const img = seo.og_image ? mediaUrl(rel, seo.og_image) : "";
    if (img) {
      upsertMeta("property", "og:image", `${SITE_URL}${img}`);
      upsertMeta("name", "twitter:image", `${SITE_URL}${img}`);
    }
    upsertLink("canonical", url);
    upsertLink("alternate", `${SITE_URL}${switchLocalePath(pathname, "en")}`, { hreflang: "en" });
    upsertLink("alternate", `${SITE_URL}${switchLocalePath(pathname, "es")}`, { hreflang: "es" });
    upsertLink("alternate", `${SITE_URL}${switchLocalePath(pathname, "en")}`, { hreflang: "x-default" });
    let robots = null;
    if (seo.robots && seo.robots !== "index") {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      robots.setAttribute("content", String(seo.robots).replace(/_/g, ","));
      robots.setAttribute("data-cms", "robots");
      document.head.appendChild(robots);
    }
    let ld = null;
    if (Array.isArray(seo.structured_data) && seo.structured_data.length) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.setAttribute("data-cms", "jsonld");
      ld.text = JSON.stringify(seo.structured_data.length === 1 ? seo.structured_data[0] : seo.structured_data);
      document.head.appendChild(ld);
    }
    return () => {
      if (robots) robots.remove();
      if (ld) ld.remove();
    };
  }, [page, rel, lang, pathname]);
}

function PublishedGate({ slug, children }) {
  const { lang } = useI18n();
  const rel = useRelease();
  useFavicon(rel);
  const page = findPage(rel, slug);
  usePageSeo(page, rel, lang);
  if (!page) return children;
  return <CmsSections page={page} media={rel.content.media} lang={lang} />;
}

export default function CmsGate({ slug, children }) {
  const [token] = useState(readToken);
  const [published] = useState(cmsPublishedEnabled);
  if (token) return <PreviewGate slug={slug} token={token}>{children}</PreviewGate>;
  if (!published) return children;
  return <PublishedGate slug={slug}>{children}</PublishedGate>;
}
