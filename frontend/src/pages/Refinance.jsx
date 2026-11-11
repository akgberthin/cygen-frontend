import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Ban, Home, Plus, UserCheck } from "lucide-react";
import Seo from "../components/Seo";
import { CheckList, PageBanner, Reveal, Section, SectionTitle } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { localizedPath } from "../lib/links";
import { IMAGES } from "../lib/images";

export default function Refinance() {
  const { t, lang } = useI18n();

  return (
    <>
      <Seo pageKey="refinance" />
      <PageBanner image={IMAGES.refinance} alt={t("banners.refinance.alt")} eyebrow={t("nav.refinance")} title={t("refi.title")} intro={t("refi.intro")} caption={t("banners.refinance.caption")} icon={Home} testid="banner-refinance" variant="split" />

      {/* Identity: two halves joined into one partnership */}
      <Section>
        <div className="relative grid gap-6 md:grid-cols-2 md:gap-0">
          <Reveal className="card p-7 sm:p-9 md:rounded-r-none md:border-r-0">
            <article data-testid="refi-you-bring">
              <h2 className="text-xl font-semibold">{t("refi.youBring.title")}</h2>
              <div className="mt-5">
                <CheckList items={t("refi.youBring.items")} />
              </div>
            </article>
          </Reveal>
          <Reveal delay={0.12} className="card bg-surface-2 p-7 sm:p-9 md:rounded-l-none md:border-l-0">
            <article data-testid="refi-cygen-does">
              <h2 className="text-xl font-semibold">{t("refi.cygenDoes.title")}</h2>
              <div className="mt-5">
                <CheckList items={t("refi.cygenDoes.items")} />
              </div>
            </article>
          </Reveal>
          <span className="absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-background text-gold-text md:flex" aria-hidden="true">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </Section>

      {/* Not offered: a ruled-off band, visually set apart */}
      <Section className="!pt-0">
        <Reveal>
          <div className="rounded-[10px] border-l-4 border-l-gold bg-surface-2 p-8 sm:p-10" data-testid="refi-not-offered">
            <div className="flex items-center gap-4">
              <Ban className="h-7 w-7 text-gold-text" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-tight">{t("refi.notOffered.title")}</h2>
            </div>
            <ul className="mt-6 max-w-3xl space-y-3 text-base leading-relaxed text-body">
              {t("refi.notOffered.items").map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">{t("refi.notOffered.note")}</p>
          </div>
        </Reveal>
      </Section>

      {/* Steps as ghost-numbered ruled columns */}
      <Section className="!pt-0">
        <SectionTitle title={t("refi.steps.title")} />
        <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {t("refi.steps.items").map((step, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <li className="h-full border-t-2 border-gold/40 pt-5" data-testid={`refi-step-${i + 1}`}>
                <span className="text-5xl font-bold text-gold/30" aria-hidden="true">{i + 1}</span>
                <p className="mt-3 text-sm leading-relaxed text-body">{step}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section className="!pt-0">
        <Reveal>
          <div className="card flex flex-col gap-4 p-7 sm:flex-row sm:items-start" data-testid="refi-who-decides">
            <span className="inline-flex w-fit rounded-[7px] bg-surface-3 p-2.5 text-gold-text" aria-hidden="true">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{t("refi.whoDecides.title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("refi.whoDecides.text")}</p>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="card bg-surface-2 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("refi.cta.title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("refi.cta.text")}</p>
            <div className="mt-8">
              <Link to={localizedPath(lang, "contact?path=refinance")} data-testid="refi-contact-cta" className="btn-primary">
                {t("refi.cta.button")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
