import React from "react";
import Seo from "../components/Seo";
import FaqAccordion from "../components/FaqAccordion";
import { PageHeader, Reveal, Section } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { SITE_URL } from "../lib/links";

export default function Faq() {
  const { t } = useI18n();
  const items = t("faq.items");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}/en/faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <Seo pageKey="faq" jsonLd={jsonLd} />
      <Section>
        <PageHeader eyebrow="FAQ" title={t("faq.title")} intro={t("faq.intro")} />
        {/* Identity: a giant question-mark index beside a numbered ledger of answers */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[280px_1fr]">
          <div className="relative hidden self-start lg:sticky lg:top-24 lg:block" aria-hidden="true">
            <span className="block select-none text-[11rem] font-bold leading-none text-gold/15">?</span>
            <span className="mt-2 block text-sm font-semibold text-muted-foreground">{items.length} · FAQ</span>
          </div>
          <Reveal className="max-w-3xl">
            <FaqAccordion items={items} testidPrefix="faq" numbered />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
