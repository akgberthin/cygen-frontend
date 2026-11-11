import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, DoorOpen, Flag, HeartHandshake, ShieldCheck } from "lucide-react";
import Seo from "../components/Seo";
import { PageBanner, Reveal, Section, SectionTitle } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { localizedPath } from "../lib/links";
import { IMAGES } from "../lib/images";

export default function LimitedPartners() {
  const { t, lang } = useI18n();

  return (
    <>
      <Seo pageKey="limitedPartners" />
      <PageBanner image={IMAGES.limitedPartners} alt={t("banners.limitedPartners.alt")} eyebrow="LP" title={t("lp.title")} intro={t("lp.intro")} caption={t("banners.limitedPartners.caption")} icon={HeartHandshake} testid="banner-limited-partners" variant="arch" />

      {/* Identity: an editorial page — pull quote, ruled columns, one gold statement panel */}
      <Section>
        <Reveal>
          <p className="eyebrow">{t("lp.role.title")}</p>
          <blockquote className="mt-5 max-w-3xl border-l-4 border-gold pl-6 sm:pl-8" data-testid="lp-role-quote">
            <p className="text-2xl font-semibold leading-snug text-cream sm:text-3xl">{t("lp.role.text")}</p>
          </blockquote>
        </Reveal>
      </Section>

      <Section className="!pt-0">
        <SectionTitle title={t("lp.payment.title")} subtitle={t("lp.payment.text")} />
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {[t("lp.payment.p1"), t("lp.payment.p2"), t("lp.payment.p3")].map((text, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="h-full border-t-2 border-gold pt-6" data-testid={`lp-payment-${i + 1}`}>
                <span className="text-4xl font-bold text-gold/40" aria-hidden="true">0{i + 1}</span>
                <p className="mt-4 text-sm leading-relaxed text-body">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionTitle title={t("lp.safeguards.title")} />
        <div className="mt-10 divide-y divide-border border-y border-border">
          {[
            { key: "s1", Icon: HeartHandshake, testid: "lp-safeguard-halt" },
            { key: "s2", Icon: ShieldCheck, testid: "lp-safeguard-reversed" },
          ].map(({ key, Icon, testid }) => (
            <Reveal key={key}>
              <div className="grid items-start gap-4 py-8 sm:grid-cols-[1fr_2fr] sm:gap-10" data-testid={testid}>
                <h3 className="flex items-center gap-3 text-lg font-semibold">
                  <span className="inline-flex rounded-[7px] bg-surface-3 p-2 text-gold-text" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  {t(`lp.safeguards.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:pt-2">{t(`lp.safeguards.${key}.text`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionTitle title={t("lp.milestones.title")} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Reveal>
            <article className="card h-full p-8" data-testid="lp-milestone-exit">
              <DoorOpen className="h-6 w-6 text-gold-text" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold">{t("lp.milestones.m1.title")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("lp.milestones.m1.text")}</p>
            </article>
          </Reveal>
          <Reveal delay={0.12}>
            <article className="h-full rounded-[10px] bg-[#c9a84c] p-8" data-testid="lp-milestone-complete">
              <Flag className="h-6 w-6 text-[#0a0e18]" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold text-[#0a0e18]">{t("lp.milestones.m2.title")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#0a0e18]/85">{t("lp.milestones.m2.text")}</p>
            </article>
          </Reveal>
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="card bg-surface-2 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("lp.cta.title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("lp.cta.text")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={localizedPath(lang, "faq")} data-testid="lp-faq-cta" className="btn-outline">
                {t("lp.cta.faq")}
              </Link>
              <Link to={localizedPath(lang, "contact")} data-testid="lp-contact-cta" className="btn-primary">
                {t("lp.cta.contact")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
