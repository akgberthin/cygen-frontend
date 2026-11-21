import React from "react";
import { KeyRound, RefreshCcw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import ComparisonCalculator from "../components/ComparisonCalculator";
import EquityEngine from "../components/EquityEngine";
import HeroSlider from "../components/HeroSlider";
import { CheckList, FeatureCard, PageBanner, Reveal, Section, SectionTitle } from "../components/Shared";
import CmsLink from "./CmsLink";
import { Arrow, Buttons, ICONS, rich } from "./shared";
import { EXTRA, VARIANTS } from "./sections2";

/* Draws one section of a CMS page with the website's own components and look. `ctx` holds the language, the media manifest and a text picker. */

const PATH_ICONS = [KeyRound, RefreshCcw];

const REGISTRY = {
  ...EXTRA,

  hero_slider(s, ctx) {
    const sl = s.resolved_slider;
    if (!sl) return null;
    const data = {
      seconds: sl.autoplay_seconds,
      note: ctx.tx(sl.note),
      slides: sl.slides.map((x) => ({
        src: ctx.media(x.image),
        alt: ctx.tx(x.alt),
        eyebrow: ctx.tx(x.eyebrow),
        title: ctx.tx(x.title),
        text: ctx.tx(x.text),
        buttons: (x.buttons || []).map((b) => ({ label: ctx.tx(b.label), url: b.url })),
      })),
    };
    return <HeroSlider data={data} />;
  },

  values_marquee(s, ctx) {
    const items = (s.props.items || []).map((i) => ctx.tx(i.text)).filter(Boolean);
    if (!items.length) return null;
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
  },

  path_cards(s, ctx) {
    const p = s.props;
    return (
      <Section id="paths">
        <Reveal>
          <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(p.cards || []).map((c, i) => {
            const Icon = PATH_ICONS[i % PATH_ICONS.length];
            return (
              <Reveal key={i} delay={i * 0.12}>
                <article className="card flex h-full flex-col p-7 transition-colors hover:border-gold/50" data-testid={`path-card-${i === 0 ? "buy" : "bring"}`}>
                  <span className="inline-flex w-fit rounded-[7px] bg-surface-3 p-2.5 text-gold-text" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold">{ctx.tx(c.title)}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ctx.tx(c.text)}</p>
                  <div className="mt-5 flex-1">
                    <CheckList items={(c.points || []).map((x) => ctx.tx(x.text))} />
                  </div>
                  {c.url ? (
                    <div className="mt-6">
                      <CmsLink url={c.url} className="btn-primary">
                        {ctx.tx(c.label)}
                        <Arrow />
                      </CmsLink>
                    </div>
                  ) : null}
                </article>
              </Reveal>
            );
          })}
        </div>
      </Section>
    );
  },

  equity_engine(s, ctx) {
    const p = s.props;
    return (
      <Section className="!pt-0">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
            <ol className="mt-8 space-y-5">
              {(p.points || []).map((pt, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-sm font-bold text-gold-text" aria-hidden="true">{i + 1}</span>
                  <p className="pt-1 text-sm leading-relaxed text-body">{ctx.tx(pt.text)}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.15}>
            <EquityEngine />
          </Reveal>
        </div>
      </Section>
    );
  },

  feature_cards(s, ctx) {
    const alt = VARIANTS.feature_cards(s, ctx);
    if (alt) return alt;
    const p = s.props;
    const cols = (s.style && s.style.layout) || "3-columns";
    const boxed = cols !== "2-columns";
    const grid = cols === "2-columns" ? "sm:grid-cols-2 gap-6" : cols === "4-columns" ? "sm:grid-cols-2 lg:grid-cols-4 gap-8" : "md:grid-cols-3 gap-8";
    const cards = (
      <div className={`mt-10 grid ${grid}`}>
        {(p.items || []).map((it, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <FeatureCard icon={ICONS[it.icon]} title={ctx.tx(it.title)} text={ctx.tx(it.text)} testid={`feature-${i + 1}`} />
          </Reveal>
        ))}
      </div>
    );
    return (
      <Section className="!pt-0">
        <Reveal>
          {boxed ? (
            <div className="card bg-surface-2 p-8 sm:p-12">
              <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
              {cards}
              {ctx.tx(p.note) ? <p className="mt-8 text-xs text-dim">{ctx.tx(p.note)}</p> : null}
            </div>
          ) : (
            <>
              <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
              {cards}
            </>
          )}
        </Reveal>
      </Section>
    );
  },

  steps(s, ctx) {
    const alt = VARIANTS.steps(s, ctx);
    if (alt) return alt;
    const p = s.props;
    const items = p.items || [];
    const layout = (s.style && s.style.layout) || "numbered";
    if (layout === "timeline") {
      return (
        <Section>
          <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
          <ol className="relative mt-12 space-y-10 before:absolute before:bottom-8 before:left-[19px] before:top-2 before:w-px before:bg-gradient-to-b before:from-gold before:via-gold/40 before:to-transparent sm:before:left-[23px]">
            {items.map((it, i) => (
              <li key={i} className="relative flex gap-6">
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold bg-background text-sm font-bold text-gold-text sm:h-12 sm:w-12" aria-hidden="true">{i + 1}</span>
                <Reveal className={`card flex-1 p-6 ${i % 2 ? "lg:ml-20" : "lg:mr-20"}`}>
                  <h2 className="text-lg font-semibold">{ctx.tx(it.title)}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{ctx.tx(it.text)}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>
      );
    }
    if (layout === "ledger") {
      return (
        <Section className="!pt-0">
          <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
          <div className="mt-10 divide-y divide-border border-y border-border">
            {items.map((it, i) => (
              <Reveal key={i}>
                <div className="grid gap-2 py-6 sm:grid-cols-[72px_260px_1fr] sm:items-baseline sm:gap-6">
                  <span className="text-2xl font-bold text-gold/60" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-base font-semibold text-gold-text">{ctx.tx(it.title)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{ctx.tx(it.text)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      );
    }
    return (
      <Section className="!pt-0">
        <Reveal>
          <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
        </Reveal>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <li className="card relative h-full p-6" data-testid={`step-card-${i + 1}`}>
                <span className="text-3xl font-bold text-gold-text" aria-hidden="true">{i + 1}</span>
                <h3 className="mt-3 text-base font-semibold">{ctx.tx(it.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ctx.tx(it.text)}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>
    );
  },

  calculator() {
    return (
      <Section className="!pt-0" id="compare">
        <Reveal>
          <ComparisonCalculator />
        </Reveal>
      </Section>
    );
  },

  faq(s, ctx) {
    const p = s.props;
    const items = (p.items || []).map((it) => ({ q: ctx.tx(it.question), a: ctx.tx(it.answer) }));
    const limit = Number(p.limit) > 0 ? Number(p.limit) : items.length;
    const indexed = p.numbered && !ctx.tx(p.title); // the FAQ page: a big question mark beside the numbered answers
    const accordion = (
      <Accordion type="single" collapsible className="w-full" data-testid="cms-faq-accordion">
        {items.slice(0, limit).map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-base font-medium text-cream hover:text-gold-text hover:no-underline">
              <span className="flex items-baseline gap-4">
                {p.numbered ? <span className="shrink-0 text-sm font-bold text-gold/70" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span> : null}
                <span>{item.q}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className={`text-sm leading-relaxed text-muted-foreground ${p.numbered ? "sm:pl-9" : ""}`}>
              <div dangerouslySetInnerHTML={rich(item.a)} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
    if (indexed) {
      return (
        <Section className="!pt-0">
          <div className="mt-12 grid gap-10 lg:grid-cols-[280px_1fr]">
            <div className="relative hidden self-start lg:sticky lg:top-24 lg:block" aria-hidden="true">
              <span className="block select-none text-[11rem] font-bold leading-none text-gold/15">?</span>
              <span className="mt-2 block text-sm font-semibold text-muted-foreground">{items.length} · FAQ</span>
            </div>
            <Reveal className="max-w-3xl">{accordion}</Reveal>
          </div>
        </Section>
      );
    }
    return (
      <Section className="!pt-0">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <Reveal>
            <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
            {ctx.tx(p.link_label) && p.link_url ? (
              <CmsLink url={p.link_url} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-text transition-colors hover:text-gold">
                {ctx.tx(p.link_label)}
              </CmsLink>
            ) : null}
          </Reveal>
          <Reveal delay={0.1}>
            {accordion}
          </Reveal>
        </div>
      </Section>
    );
  },

  cta_band(s, ctx) {
    const alt = VARIANTS.cta_band(s, ctx);
    if (alt) return alt;
    const p = s.props;
    return (
      <Section>
        <Reveal>
          <div className="card relative overflow-hidden bg-surface-2 px-6 py-14 text-center sm:px-12">
            <div className="anim-pulse pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-gold/15" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rotate-45 border-[18px] border-gold/10" aria-hidden="true" />
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{ctx.tx(p.title)}</h2>
            {ctx.tx(p.text) ? <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{ctx.tx(p.text)}</p> : null}
            <Buttons list={p.buttons} ctx={ctx} center />
          </div>
        </Reveal>
      </Section>
    );
  },

  page_banner(s, ctx) {
    const p = s.props;
    const variant = (s.style && s.style.layout) || "left";
    /* The rail banner counts its stages from the timeline further down the same page. */
    const timeline = variant === "rail" && ctx.page ? (ctx.page.sections || []).find((x) => x.type === "steps" && x.style && x.style.layout === "timeline") : null;
    const rail = timeline && timeline.props && Array.isArray(timeline.props.items) ? timeline.props.items.length : undefined;
    return (
      <PageBanner image={ctx.media(p.image)} alt={ctx.tx(p.alt)} eyebrow={ctx.tx(p.eyebrow)} title={ctx.tx(p.title)} intro={ctx.tx(p.intro)} caption={ctx.tx(p.caption)} icon={ICONS[p.icon]} rail={rail} variant={variant} />
    );
  },

  rich_text(s, ctx) {
    const alt = VARIANTS.rich_text(s, ctx);
    if (alt) return alt;
    const p = s.props;
    return (
      <Section>
        {ctx.tx(p.title) ? <SectionTitle title={ctx.tx(p.title)} /> : null}
        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-body [&_a]:text-gold-text [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={rich(ctx.tx(p.body))} />
      </Section>
    );
  },
};

/** The classes that hide a section on the devices the editor switched off. */
function deviceClasses(devices) {
  const d = devices || {};
  return [d.mobile === false ? "max-md:hidden" : "", d.tablet === false ? "md:max-lg:hidden" : "", d.desktop === false ? "lg:hidden" : ""].filter(Boolean).join(" ");
}

const GAP = { sm: "1.5rem", md: "3rem", lg: "5rem", xl: "7rem" };
const ALIGN_CLASS = { left: "text-left", center: "text-center", right: "text-right" };

/** #rrggbb (or #rgb) as it is, token:name as the site's colour variable; anything else is ignored. */
function colorOf(v) {
  const c = String(v || "");
  if (/^#[0-9a-fA-F]{3,8}$/.test(c)) return c;
  const m = /^token:([a-z0-9-]{1,40})$/.exec(c);
  return m ? `var(--c-${m[1]})` : "";
}

/** The class names and inline style a section's style overrides add to its wrapper (all optional, ignored when unknown). */
function styleOverrides(style) {
  const st = style && typeof style === "object" ? style : {};
  const cls = [ALIGN_CLASS[st.align] || ""];
  if (st.width === "narrow") cls.push("mx-auto max-w-3xl");
  else if (st.width === "wide") cls.push("[&>section]:max-w-7xl");
  else if (st.width === "full") cls.push("[&>section]:max-w-none");
  const css = {};
  if (st.padding_top === "none") cls.push("[&>section]:!pt-0");
  else if (GAP[st.padding_top]) css.paddingTop = GAP[st.padding_top];
  if (st.padding_bottom === "none") cls.push("[&>section]:!pb-0");
  else if (GAP[st.padding_bottom]) css.paddingBottom = GAP[st.padding_bottom];
  const bg = colorOf(st.background);
  const fg = colorOf(st.text_color);
  if (bg) css.backgroundColor = bg;
  if (fg) css.color = fg;
  return { className: cls.filter(Boolean).join(" "), style: Object.keys(css).length ? css : undefined };
}

export function CmsSections({ page, media, lang }) {
  const ctx = {
    lang,
    page,
    tx: (v) => (v && typeof v === "object" ? v[lang] || v.en || "" : typeof v === "string" ? v : ""),
    media: (id) => {
      const m = id && media ? media[id] : null;
      return m ? `/cms-media/${String(m.path).replace(/^\/media\//, "")}` : "";
    },
  };
  return (
    <>
      <h1 className="sr-only">{ctx.tx(page.title)}</h1>
      {(page.sections || [])
        .filter((s) => s.enabled !== false)
        .map((s) => {
          const draw = REGISTRY[s.type];
          const over = styleOverrides(s.style);
          const wrap = [deviceClasses(s.devices), over.className].filter(Boolean).join(" ");
          const safe = { ...s, props: s.props || {} };
          return (
            <div key={s.section_id} className={wrap || undefined} style={over.style} data-cms-section={s.type}>
              {draw ? draw(safe, ctx) : (
                <div className="mx-auto my-6 max-w-6xl rounded-lg border border-dashed border-gold/40 px-4 py-6 text-sm text-dim">
                  Section type “{s.type}” is not drawn on the website yet.
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}
