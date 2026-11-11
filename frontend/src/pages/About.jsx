import React from "react";
import { Compass } from "lucide-react";
import Seo from "../components/Seo";
import { CtaBand, PageBanner, Reveal, Section, SectionTitle } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { IMAGES } from "../lib/images";

const ROMAN = ["I", "II", "III"];

export default function About() {
  const { t } = useI18n();

  return (
    <>
      <Seo pageKey="about" />
      <PageBanner image={IMAGES.about} alt={t("banners.about.alt")} eyebrow="CYGEN" title={t("about.title")} intro={t("about.p1")} caption={t("banners.about.caption")} icon={Compass} testid="banner-about" variant="center" />

      {/* Identity: a manifesto — drop-cap reading columns and numbered principles */}
      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal>
            <p className="text-lg leading-relaxed text-body">
              {t("about.p2")}
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-lg leading-relaxed text-body md:pt-10">{t("about.p3")}</p>
          </Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionTitle title={t("about.principlesTitle")} />
        <div className="mt-10 divide-y divide-border border-y border-border">
          {t("about.principles").map((p, i) => (
            <Reveal key={p.title}>
              <div className="grid items-baseline gap-3 py-8 sm:grid-cols-[110px_220px_1fr] sm:gap-8" data-testid={`principle-${i + 1}`}>
                <span className="text-4xl font-bold tracking-wide text-gold/50" aria-hidden="true">{ROMAN[i]}</span>
                <h3 className="text-xl font-semibold">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand title={t("home.cta.title")} text={t("home.cta.text")} buyLabel={t("home.cta.buy")} bringLabel={t("home.cta.bring")} />
    </>
  );
}
