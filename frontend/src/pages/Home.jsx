import React from "react";
import { Link } from "react-router-dom";
import { HandCoins, Handshake, Home as HomeIcon, KeyRound, Landmark, RefreshCcw, ShieldCheck, TrendingUp, UserCheck, Vault } from "lucide-react";
import Seo from "../components/Seo";
import HeroSlider from "../components/HeroSlider";
import EquityEngine from "../components/EquityEngine";
import ComparisonCalculator from "../components/ComparisonCalculator";
import FaqAccordion from "../components/FaqAccordion";
import { ApplyCta, CheckList, CtaBand, FeatureCard, Reveal, Section, SectionTitle } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { localizedPath } from "../lib/links";

function ValuesMarquee() {
  const { t } = useI18n();
  const items = t("home.marquee");
  const row = [...items, ...items];
  return (
    <div className="marquee overflow-hidden border-b border-border bg-surface py-5" data-testid="values-marquee">
      <div className="marquee-track flex w-max items-center" aria-hidden="true">
        {row.map((item, i) => (
          <span key={i} className="flex items-center text-sm font-semibold uppercase tracking-[0.32em] text-dim">
            <span className="px-8">{item}</span>
            <svg viewBox="0 0 8 8" className="h-2 w-2 shrink-0" aria-hidden="true">
              <rect x="1.5" y="1.5" width="5" height="5" transform="rotate(45 4 4)" fill="var(--c-gold)" fillOpacity="0.7" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { t, lang } = useI18n();
  const teaser = [0, 1, 2].map((i) => t("faq.items")[i]).filter(Boolean);

  return (
    <>
      <Seo pageKey="home" />
      <h1 className="sr-only">{t("home.hero.title")}</h1>
      <HeroSlider />
      <ValuesMarquee />

      <Section id="paths">
        <Reveal>
          <SectionTitle title={t("home.paths.title")} subtitle={t("home.paths.subtitle")} />
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            { key: "buy", path: "purchase", Icon: KeyRound, testid: "path-card-buy" },
            { key: "bring", path: "refinance", Icon: RefreshCcw, testid: "path-card-bring" },
          ].map(({ key, path, Icon, testid }, i) => (
            <Reveal key={key} delay={i * 0.12}>
              <article className="card flex h-full flex-col p-7 transition-colors hover:border-gold/50" data-testid={testid}>
                <span className="inline-flex w-fit rounded-[7px] bg-surface-3 p-2.5 text-gold-text" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">{t(`home.paths.${key}.title`)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`home.paths.${key}.text`)}</p>
                <div className="mt-5 flex-1">
                  <CheckList items={t(`home.paths.${key}.points`)} />
                </div>
                <div className="mt-6">
                  <ApplyCta path={path} testid={`${testid}-cta`}>{t(`home.paths.${key}.cta`)}</ApplyCta>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionTitle title={t("home.engine.title")} subtitle={t("home.engine.subtitle")} />
            <ol className="mt-8 space-y-5">
              {t("home.engine.points").map((point, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-sm font-bold text-gold-text" aria-hidden="true">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-body">{point}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.15}>
            <EquityEngine />
          </Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <Reveal>
          <div className="card bg-surface-2 p-8 sm:p-12">
            <SectionTitle title={t("home.market.title")} subtitle={t("home.market.subtitle")} />
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <FeatureCard icon={TrendingUp} title={t("home.market.m1.title")} text={t("home.market.m1.text")} testid="market-1" />
              <FeatureCard icon={Vault} title={t("home.market.m2.title")} text={t("home.market.m2.text")} testid="market-2" />
              <FeatureCard icon={Handshake} title={t("home.market.m3.title")} text={t("home.market.m3.text")} testid="market-3" />
            </div>
            <p className="mt-8 text-xs text-dim">{t("home.market.note")}</p>
          </div>
        </Reveal>
      </Section>

      <Section className="!pt-0">
        <Reveal>
          <SectionTitle title={t("home.steps.title")} subtitle={t("home.steps.subtitle")} />
        </Reveal>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {["s1", "s2", "s3", "s4"].map((s, i) => (
            <Reveal key={s} delay={i * 0.1}>
              <li className="card relative h-full p-6" data-testid={`step-card-${i + 1}`}>
                <span className="text-3xl font-bold text-gold-text" aria-hidden="true">{i + 1}</span>
                <h3 className="mt-3 text-base font-semibold">{t(`home.steps.${s}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`home.steps.${s}.text`)}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section className="!pt-0">
        <Reveal>
          <SectionTitle title={t("home.different.title")} />
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Reveal><FeatureCard icon={Handshake} title={t("home.different.d1.title")} text={t("home.different.d1.text")} testid="different-1" /></Reveal>
          <Reveal delay={0.08}><FeatureCard icon={HandCoins} title={t("home.different.d2.title")} text={t("home.different.d2.text")} testid="different-2" /></Reveal>
          <Reveal delay={0.16}><FeatureCard icon={ShieldCheck} title={t("home.different.d3.title")} text={t("home.different.d3.text")} testid="different-3" /></Reveal>
          <Reveal delay={0.24}><FeatureCard icon={Landmark} title={t("home.different.d4.title")} text={t("home.different.d4.text")} testid="different-4" /></Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <Reveal>
          <div className="card bg-surface-2 p-8 sm:p-10">
            <SectionTitle title={t("home.trust.title")} />
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              <FeatureCard icon={UserCheck} title={t("home.trust.t1.title")} text={t("home.trust.t1.text")} testid="trust-1" />
              <FeatureCard icon={HomeIcon} title={t("home.trust.t2.title")} text={t("home.trust.t2.text")} testid="trust-2" />
              <FeatureCard icon={ShieldCheck} title={t("home.trust.t3.title")} text={t("home.trust.t3.text")} testid="trust-3" />
            </div>
          </div>
        </Reveal>
      </Section>

      <Section className="!pt-0" id="compare">
        <Reveal>
          <ComparisonCalculator />
        </Reveal>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <Reveal>
            <SectionTitle title={t("home.faqTeaser.title")} />
            <Link
              to={localizedPath(lang, "faq")}
              data-testid="faq-teaser-link"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-text transition-colors hover:text-gold"
            >
              {t("home.faqTeaser.cta")}
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <FaqAccordion items={teaser} testidPrefix="home-faq" />
          </Reveal>
        </div>
      </Section>

      <CtaBand title={t("home.cta.title")} text={t("home.cta.text")} buyLabel={t("home.cta.buy")} bringLabel={t("home.cta.bring")} />
    </>
  );
}
