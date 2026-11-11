import React from "react";
import Seo from "../components/Seo";
import { PageHeader, Section } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";

const SECTION_KEYS = ["disclosures", "privacy", "terms", "accessibility"];

export default function Legal() {
  const { t } = useI18n();

  return (
    <>
      <Seo pageKey="legal" />
      <Section>
        <PageHeader eyebrow={t("nav.legal")} title={t("legal.title")} intro={t("legal.intro")} />
        {/* Identity: a document — sticky table of contents beside ruled sections */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav aria-label={t("legal.title")} className="lg:sticky lg:top-24 lg:self-start" data-testid="legal-toc">
            <ol className="space-y-1 border-l-2 border-border">
              {SECTION_KEYS.map((key, i) => (
                <li key={key}>
                  <a
                    href={`#legal-${key}`}
                    data-testid={`legal-toc-${key}`}
                    className="-ml-0.5 block border-l-2 border-transparent py-2 pl-4 text-sm text-muted-foreground transition-colors hover:border-gold hover:text-gold-text"
                  >
                    <span className="mr-2 text-xs font-bold text-dim">{String(i + 1).padStart(2, "0")}</span>
                    {t(`legal.${key}.title`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-3xl">
            {SECTION_KEYS.map((key) => (
              <article key={key} id={`legal-${key}`} className="scroll-mt-24 border-t border-border py-10 first:border-t-0 first:pt-0" data-testid={`legal-${key}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{t(`legal.${key}.title`)}</h2>
                  <span className="rounded-[7px] border border-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-text" data-testid={`legal-${key}-draft-badge`}>
                    {t("common.draftBadge")}
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  {t(`legal.${key}.paragraphs`).map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
