import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Handshake, MessagesSquare, Scale, Users } from "lucide-react";
import Seo from "../components/Seo";
import { CheckList, PageBanner, Reveal, Section } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { localizedPath } from "../lib/links";
import { IMAGES } from "../lib/images";

export default function Brokers() {
  const { t, lang } = useI18n();
  const cards = [
    { key: "who", Icon: Users, off: "" },
    { key: "how", Icon: MessagesSquare, off: "md:translate-y-8" },
    { key: "standards", Icon: Scale, off: "md:translate-y-16" },
  ];

  return (
    <>
      <Seo pageKey="brokers" />
      <PageBanner image={IMAGES.brokers} alt={t("banners.brokers.alt")} eyebrow={t("nav.brokers")} title={t("brokers.title")} intro={t("brokers.intro")} caption={t("banners.brokers.caption")} icon={Handshake} testid="banner-brokers" variant="glass" />

      {/* Identity: a stepped cascade of cards ending in a full-width gold band */}
      <Section>
        <div className="grid gap-6 md:grid-cols-3 md:pb-16">
          {cards.map(({ key, Icon, off }, i) => (
            <Reveal key={key} delay={i * 0.1}>
              <article className={`card h-full border-t-2 border-t-gold p-7 ${off}`} data-testid={`brokers-${key}`}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-[7px] bg-surface-3 p-2.5 text-gold-text" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-bold text-gold/40" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold">{t(`brokers.${key}.title`)}</h2>
                <div className="mt-4">
                  <CheckList items={t(`brokers.${key}.items`)} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="bg-[#c9a84c]" data-testid="brokers-gold-cta">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#0a0e18] sm:text-3xl">{t("brokers.cta.title")}</h2>
          <p className="mt-3 max-w-xl text-[#0a0e18]/80">{t("brokers.cta.text")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={localizedPath(lang, "workshops")} data-testid="brokers-workshops-cta" className="btn !bg-[#0a0e18] !text-[#d8b95a] hover:!bg-[#162036]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {t("brokers.cta.workshops")}
            </Link>
            <Link to={localizedPath(lang, "contact")} data-testid="brokers-contact-cta" className="btn border !border-[#0a0e18]/50 !text-[#0a0e18] hover:!border-[#0a0e18]">
              {t("brokers.cta.contact")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
