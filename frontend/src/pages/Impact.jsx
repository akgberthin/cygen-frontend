import React from "react";
import { BookOpenText, FileCheck2, Handshake, KeyRound } from "lucide-react";
import Seo from "../components/Seo";
import { CtaBand, Reveal, Section, TypeBanner } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";

const AREA_ICONS = [KeyRound, BookOpenText, Handshake, FileCheck2];
const LETTERS = ["A", "B", "C", "D"];

export default function Impact() {
  const { t } = useI18n();
  const areas = t("impact.areas");

  return (
    <>
      <Seo pageKey="impact" />
      <TypeBanner eyebrow="CYGEN" title={t("impact.title")} intro={t("impact.intro")} ghost={t("nav.impact")} testid="banner-impact" ghostVariant="outline" />

      {/* Identity: alternating offset panels, letter-indexed, closing honesty note */}
      <Section>
        <div className="space-y-8">
          {areas.map((a, i) => {
            const Icon = AREA_ICONS[i % AREA_ICONS.length];
            return (
              <Reveal key={a.title}>
                <article
                  className={`card flex flex-col gap-5 p-8 sm:flex-row sm:items-start sm:gap-8 ${i % 2 ? "lg:ml-20" : "lg:mr-20"}`}
                  data-testid={`impact-area-${i}`}
                >
                  <div className="flex items-center gap-4 sm:flex-col sm:items-center">
                    <span className="text-3xl font-bold text-gold/50" aria-hidden="true">{LETTERS[i]}</span>
                    <span className="inline-flex rounded-[7px] bg-surface-3 p-3 text-gold-text" aria-hidden="true">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold sm:text-2xl">{a.title}</h2>
                    <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{a.text}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <p className="mx-auto mt-12 max-w-2xl rounded-[10px] border border-gold/30 bg-surface-2 px-5 py-4 text-center text-sm font-medium text-body" data-testid="impact-note">
            {t("impact.note")}
          </p>
        </Reveal>
      </Section>

      <CtaBand title={t("home.cta.title")} text={t("home.cta.text")} buyLabel={t("home.cta.buy")} bringLabel={t("home.cta.bring")} />
    </>
  );
}
