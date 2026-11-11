import React from "react";
import Seo from "../components/Seo";
import { CtaBand, Reveal, Section, TypeBanner } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";

export default function Philosophy() {
  const { t } = useI18n();
  const beliefs = t("philosophy.beliefs");

  return (
    <>
      <Seo pageKey="philosophy" />
      <TypeBanner eyebrow="CYGEN" title={t("philosophy.title")} intro={t("philosophy.intro")} ghost={t("nav.philosophy")} testid="banner-philosophy" ghostVariant="vertical" />

      {/* Identity: oversized ghost numerals beside each belief, nothing boxed */}
      <Section>
        <ol className="space-y-16">
          {beliefs.map((b, i) => (
            <Reveal key={b.title}>
              <li className="grid items-start gap-6 sm:grid-cols-[160px_1fr] sm:gap-12" data-testid={`belief-${i + 1}`}>
                <span className="select-none text-7xl font-bold leading-none text-gold/25 sm:text-8xl" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="border-l-2 border-gold/50 pl-6 sm:pl-8">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{b.title}</h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{b.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <CtaBand title={t("home.cta.title")} text={t("home.cta.text")} buyLabel={t("home.cta.buy")} bringLabel={t("home.cta.bring")} />
    </>
  );
}
