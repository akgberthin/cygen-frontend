import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { SITE_URL, switchLocalePath } from "../lib/links";

function upsertMeta(attr, name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href, extra = {}) {
  const key = extra.hreflang ? `${rel}:${extra.hreflang}` : rel;
  let el = document.head.querySelector(`link[data-seo="${key}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute("data-seo", key);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
}

export default function Seo({ pageKey, jsonLd }) {
  const { t, lang } = useI18n();
  const { pathname } = useLocation();

  useEffect(() => {
    const title = t(`meta.${pageKey}.title`);
    const description = t(`meta.${pageKey}.description`);
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", `${SITE_URL}${pathname}`);
    upsertMeta("property", "og:locale", lang === "es" ? "es_ES" : "en_US");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertLink("canonical", `${SITE_URL}${pathname}`);
    upsertLink("alternate", `${SITE_URL}${switchLocalePath(pathname, "en")}`, { hreflang: "en" });
    upsertLink("alternate", `${SITE_URL}${switchLocalePath(pathname, "es")}`, { hreflang: "es" });
    upsertLink("alternate", `${SITE_URL}${switchLocalePath(pathname, "en")}`, { hreflang: "x-default" });
  }, [pageKey, lang, pathname, t]);

  useEffect(() => {
    if (!jsonLd) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "page-jsonld";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("page-jsonld");
      if (el) el.remove();
    };
  }, [jsonLd]);

  return null;
}
