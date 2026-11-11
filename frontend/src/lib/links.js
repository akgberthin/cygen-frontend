export const SITE_URL = "https://cygenequities.com";

export const NAV_LINKS = [
  { key: "howItWorks", path: "how-it-works" },
  { key: "refinance", path: "refinance" },
  { key: "limitedPartners", path: "limited-partners" },
  { key: "brokers", path: "brokers" },
  { key: "faq", path: "faq" },
];

export const FOOTER_COMPANY_LINKS = [
  { key: "about", path: "about" },
  { key: "team", path: "about/team" },
  { key: "philosophy", path: "about/philosophy" },
  { key: "impact", path: "about/impact" },
  { key: "resources", path: "about/resources" },
  { key: "workshopsSeminars", path: "workshops" },
  { key: "contact", path: "contact" },
  { key: "legal", path: "legal" },
];

export function localizedPath(lang, path = "") {
  return `/${lang}${path ? `/${path}` : ""}`;
}

export function applyUrl(lang, path) {
  const base = (process.env.REACT_APP_APPLY_URL || "").trim();
  if (base) {
    try {
      const url = new URL(base);
      if (path) url.searchParams.set("path", path);
      return { href: url.toString(), external: true };
    } catch (e) {
      /* fall through to internal */
    }
  }
  return { href: localizedPath(lang, `apply${path ? `?path=${path}` : ""}`), external: false };
}

export function switchLocalePath(pathname, nextLang) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length && /^[a-z]{2}$/.test(parts[0])) parts[0] = nextLang;
  else parts.unshift(nextLang);
  return `/${parts.join("/")}`;
}
