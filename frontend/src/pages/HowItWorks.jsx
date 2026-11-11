import React from "react";
import { FileSearch } from "lucide-react";
import Seo from "../components/Seo";
import { CtaBand, PageBanner, Reveal, Section, SectionTitle } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { IMAGES } from "../lib/images";

export default function HowItWorks() {
  const { t } = useI18n();
  const stages = t("how.stages");
  const concepts = t("how.concepts");

  return (
    <>
      <Seo pageKey="howItWorks" />
      <PageBanner image={IMAGES.howItWorks} alt={t("banners.howItWorks.alt")} eyebrow="CYGEN" title={t("how.title")} intro={t("how.intro")} caption={t("banners.howItWorks.caption")} icon={FileSearch} testid="banner-how-it-works" variant="rail" rail={7} />

      {/* Identity: a vertical gold timeline you walk down, stage by stage */}
      <Section>
        <SectionTitle title={t("how.stagesTitle")} />
        <ol className="relative mt-12 space-y-10 before:absolute before:bottom-8 before:left-[19px] before:top-2 before:w-px before:bg-gradient-to-b before:from-gold before:via-gold/40 before:to-transparent before:content-[''] sm:before:left-[23px]">
          {stages.map((stage, i) => (
            <li key={stage.k} className="relative flex gap-6" data-testid={`stage-${stage.k}`}>
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold bg-background text-sm font-bold text-gold-text sm:h-12 sm:w-12" aria-hidden="true">
                {i + 1}
              </span>
              <Reveal className={`card flex-1 p-6 ${i % 2 ? "lg:ml-20" : "lg:mr-20"}`}>
                <h2 className="text-lg font-semibold">{stage.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{stage.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* Concepts as a numbered ledger, not cards */}
      <Section className="!pt-0">
        <SectionTitle title={t("how.conceptsTitle")} />
        <div className="mt-10 divide-y divide-border border-y border-border">
          {concepts.map((c, i) => (
            <Reveal key={i}>
              <div className="grid gap-2 py-6 sm:grid-cols-[72px_260px_1fr] sm:items-baseline sm:gap-6" data-testid={`concept-${i}`}>
                <span className="text-2xl font-bold text-gold/60" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-base font-semibold text-gold-text">{c.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <Reveal>
          <div className="card bg-surface-2 p-8 sm:p-10" data-testid="illustrative-example">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">{t("how.example.title")}</h2>
              <span className="rounded-[7px] border border-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-text">
                {t("common.illustrative")}
              </span>
            </div>
            <dl className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">{t("how.example.r1")}</dt>
                <dd className="text-lg font-semibold text-cream">400,000</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">{t("how.example.r2")}</dt>
                <dd className="text-lg font-semibold text-cream">80,000</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">{t("how.example.r3")}</dt>
                <dd className="text-lg font-semibold text-cream">320,000</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <dt className="text-sm text-muted-foreground">{t("how.example.r4")}</dt>
                <dd className="text-lg font-semibold text-cream">{t("how.example.r4v")}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{t("how.example.r5")}</dt>
                <dd className="text-lg font-semibold text-cream">{t("how.example.r5v")}</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-dim">{t("how.example.note")}</p>
          </div>
        </Reveal>
      </Section>

      <CtaBand title={t("how.cta.title")} text={t("how.cta.text")} buyLabel={t("how.cta.buy")} bringLabel={t("how.cta.bring")} />
    </>
  );
}
