import React, { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { CmsSections } from "./sections";

/**
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

export default function CmsGate({ slug, children }) {
  const { lang } = useI18n();
  const [token] = useState(readToken);
  const [state, setState] = useState({ status: token ? "loading" : "off" });

  useEffect(() => {
    if (!token) return undefined;
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

  if (!token) return children;
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
