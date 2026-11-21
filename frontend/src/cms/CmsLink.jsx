import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { applyUrl, localizedPath } from "../lib/links";

/**
 * A link written in the CMS: "/apply?path=purchase" goes through the site's apply address, any other "/path" gets the language prefix,
 * "#anchor" stays on the page, and https, http, mailto and tel are left as they are.
 */
export default function CmsLink({ url, className, children, ...rest }) {
  const { lang } = useI18n();
  const u = String(url || "");
  if (u.startsWith("/apply")) {
    const path = new URLSearchParams(u.split("?")[1] || "").get("path") || "";
    const apply = applyUrl(lang, path || undefined);
    return (
      <a href={apply.href} className={className} {...(apply.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  }
  if (u.startsWith("/") && !u.startsWith("//")) {
    return (
      <Link to={localizedPath(lang, u.slice(1))} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  const external = /^https?:/i.test(u);
  return (
    <a href={u} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}
