import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { localizedPath } from "../lib/links";

export default function NotFound() {
  const { t, lang } = useI18n();
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center" data-testid="not-found">
      <h1 className="text-4xl font-bold">{t("common.notFoundTitle")}</h1>
      <p className="mt-4 text-muted-foreground">{t("common.notFoundText")}</p>
      <Link to={localizedPath(lang)} className="btn-primary mt-8" data-testid="not-found-home">
        {t("common.notFoundCta")}
      </Link>
    </main>
  );
}
