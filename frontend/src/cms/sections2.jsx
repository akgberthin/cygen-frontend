import React from "react";
import { ArrowRight, Ban, CalendarDays, Mail, MapPin, Phone, Plus, UserCheck } from "lucide-react";
import { ApplyWizard } from "../pages/Apply";
import { ContactForm } from "../pages/Contact";
import { EventsCalendar } from "../pages/Resources";
import { TeamExplorer, TeamGrid } from "../pages/Team";
import { WorkshopsPanel } from "../pages/Workshops";
import { CheckList, PageHeader, Reveal, Section, SectionTitle, TypeBanner } from "../components/Shared";
import CmsLink from "./CmsLink";
import { Arrow, Buttons, ICONS, rich, texts, toRoman } from "./shared";

/* The section types and layouts drawn beyond the first set in sections.jsx. Every prop may be missing: lists default to [] and text to "". */

export const layoutOf = (s) => {
  const l = s.style && s.style.layout;
  return l && l !== "standard" ? l : "";
};

/* ---------------------------------------------------------------------------------------------- types */
export const EXTRA = {
  type_banner(s, ctx) {
    const p = s.props;
    return <TypeBanner eyebrow={ctx.tx(p.eyebrow)} title={ctx.tx(p.title)} intro={ctx.tx(p.intro)} ghost={ctx.tx(p.ghost)} ghostVariant={p.ghost_variant || "corner"} />;
  },

  page_header(s, ctx) {
    const p = s.props;
    return (
      <Section className="!pb-0">
        <PageHeader eyebrow={ctx.tx(p.eyebrow)} title={ctx.tx(p.title)} intro={ctx.tx(p.intro)} />
      </Section>
    );
  },

  checklist_two_column(s, ctx) {
    const p = s.props;
    return (
      <Section>
        <div className="relative grid gap-6 md:grid-cols-2 md:gap-0">
          <Reveal className="card p-7 sm:p-9 md:rounded-r-none md:border-r-0">
            <article>
              <h2 className="text-xl font-semibold">{ctx.tx(p.left_title)}</h2>
              <div className="mt-5">
                <CheckList items={texts(p.left_items, ctx)} />
              </div>
            </article>
          </Reveal>
          <Reveal delay={0.12} className="card bg-surface-2 p-7 sm:p-9 md:rounded-l-none md:border-l-0">
            <article>
              <h2 className="text-xl font-semibold">{ctx.tx(p.right_title)}</h2>
              <div className="mt-5">
                <CheckList items={texts(p.right_items, ctx)} />
              </div>
            </article>
          </Reveal>
          <span className="absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-background text-gold-text md:flex" aria-hidden="true">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </Section>
    );
  },

  notice_band(s, ctx) {
    const p = s.props;
    const items = texts(p.items, ctx);
    const l = layoutOf(s);
    const columns = l === "columns" || (!l && ctx.tx(p.intro) && !ctx.tx(p.note));
    if (columns) {
      /* Several short points side by side, each under a gold rule with a ghost number (the Limited Partners payment points). */
      return (
        <Section className="!pt-0">
          <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} />
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {items.map((text, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="h-full border-t-2 border-gold pt-6">
                  <span className="text-4xl font-bold text-gold/40" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-4 text-sm leading-relaxed text-body">{text}</p>
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
          <div className="rounded-[10px] border-l-4 border-l-gold bg-surface-2 p-8 sm:p-10">
            <div className="flex items-center gap-4">
              <Ban className="h-7 w-7 text-gold-text" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-tight">{ctx.tx(p.title)}</h2>
            </div>
            {ctx.tx(p.intro) ? <p className="mt-4 max-w-3xl text-base text-muted-foreground">{ctx.tx(p.intro)}</p> : null}
            {items.length ? (
              <ul className="mt-6 max-w-3xl space-y-3 text-base leading-relaxed text-body">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : null}
            {ctx.tx(p.note) ? <p className="mt-5 text-sm text-muted-foreground">{ctx.tx(p.note)}</p> : null}
          </div>
        </Reveal>
      </Section>
    );
  },

  example_box(s, ctx) {
    const p = s.props;
    const rows = (p.rows || []).filter(Boolean);
    return (
      <Section className="!pt-0">
        <Reveal>
          <div className="card bg-surface-2 p-8 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">{ctx.tx(p.title)}</h2>
              {ctx.tx(p.badge) ? (
                <span className="rounded-[7px] border border-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-text">{ctx.tx(p.badge)}</span>
              ) : null}
            </div>
            {ctx.tx(p.text) ? <p className="mt-4 text-sm text-muted-foreground">{ctx.tx(p.text)}</p> : null}
            <dl className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {rows.map((r, i) => (
                <div key={i} className={`flex items-baseline justify-between gap-4 border-b border-border pb-3 ${rows.length % 2 && i === rows.length - 1 ? "sm:col-span-2" : ""}`}>
                  <dt className="text-sm text-muted-foreground">{ctx.tx(r.label)}</dt>
                  <dd className="text-lg font-semibold text-cream">{ctx.tx(r.value)}</dd>
                </div>
              ))}
            </dl>
            {ctx.tx(p.note) ? <p className="mt-6 text-xs text-dim">{ctx.tx(p.note)}</p> : null}
          </div>
        </Reveal>
      </Section>
    );
  },

  team(s, ctx) {
    const p = s.props;
    const groups = (p.groups || []).map((g, i) => ({
      key: String(i),
      label: ctx.tx(g.label),
      members: (g.members || []).map((m) => ({ role: ctx.tx(m.role), name: ctx.tx(m.name), focus: ctx.tx(m.focus) })),
    }));
    if (layoutOf(s) === "grid") return <TeamGrid note={ctx.tx(p.note)} nameTbd={ctx.tx(p.name_tbd)} groups={groups} />;
    return <TeamExplorer title={ctx.tx(p.title)} note={ctx.tx(p.note)} hint={ctx.tx(p.hint)} nameTbd={ctx.tx(p.name_tbd)} groups={groups} />;
  },

  resource_cards(s, ctx) {
    const p = s.props;
    return (
      <Section className="!pt-0">
        {ctx.tx(p.title) ? <SectionTitle title={ctx.tx(p.title)} /> : null}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {(p.items || []).map((it, i) => (
            <Reveal key={i}>
              <CmsLink url={it.url} className="card group flex h-full flex-col bg-surface-2 p-6 transition-colors hover:border-gold/50">
                <h3 className="text-lg font-semibold group-hover:text-gold-text">{ctx.tx(it.title)}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{ctx.tx(it.text)}</p>
                {ctx.tx(p.cta_label) ? (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-text">
                    {ctx.tx(p.cta_label)}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                ) : null}
              </CmsLink>
            </Reveal>
          ))}
        </div>
      </Section>
    );
  },

  legal(s, ctx) {
    const p = s.props;
    const docs = (p.sections || []).map((d, i) => ({ id: `legal-${d.key || i}`, title: ctx.tx(d.title), paragraphs: (d.paragraphs || []).map((x) => ctx.tx(x && x.text)).filter(Boolean) }));
    const badge = ctx.tx(p.badge);
    const toc = p.toc !== false && docs.length > 0;
    return (
      <Section className="!pt-0">
        <div className={`mt-12 grid gap-12 ${toc ? "lg:grid-cols-[240px_1fr]" : ""}`}>
          {toc ? (
            <nav aria-label={ctx.tx(s.name) || ctx.tx(p.badge) || "Contents"} className="lg:sticky lg:top-24 lg:self-start">
              <ol className="space-y-1 border-l-2 border-border">
                {docs.map((d, i) => (
                  <li key={d.id}>
                    <a href={`#${d.id}`} className="-ml-0.5 block border-l-2 border-transparent py-2 pl-4 text-sm text-muted-foreground transition-colors hover:border-gold hover:text-gold-text">
                      <span className="mr-2 text-xs font-bold text-dim">{String(i + 1).padStart(2, "0")}</span>
                      {d.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className="max-w-3xl">
            {docs.map((d) => (
              <article key={d.id} id={d.id} className="scroll-mt-24 border-t border-border py-10 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{d.title}</h2>
                  {badge ? <span className="rounded-[7px] border border-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-text">{badge}</span> : null}
                </div>
                <div className="mt-5 space-y-4">
                  {d.paragraphs.map((html, i) => (
                    <div key={i} className="text-sm leading-relaxed text-muted-foreground [&_a]:text-gold-text [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={rich(html)} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>
    );
  },

  contact(s, ctx) {
    const p = s.props;
    const label = ctx.tx(p.email_label);
    return (
      <Section>
        <Reveal>
          <div className="card bg-surface-2 p-7 sm:p-9">
            {ctx.tx(p.title) ? <h2 className="text-2xl font-semibold tracking-tight">{ctx.tx(p.title)}</h2> : null}
            {ctx.tx(p.intro) ? <p className="mt-3 max-w-xl text-base text-muted-foreground">{ctx.tx(p.intro)}</p> : null}
            <ul className="mt-6 space-y-4 text-sm text-body">
              {p.email ? (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-text" aria-hidden="true" />
                  <span>
                    {label ? <span className="mr-2 text-muted-foreground">{label}</span> : null}
                    <a className="text-gold-text hover:underline" href={`mailto:${p.email}`}>{p.email}</a>
                  </span>
                </li>
              ) : null}
              {p.phone ? (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-text" aria-hidden="true" />
                  <a className="text-gold-text hover:underline" href={`tel:${String(p.phone).replace(/[^+\d]/g, "")}`}>{p.phone}</a>
                </li>
              ) : null}
              {ctx.tx(p.address) ? (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-text" aria-hidden="true" />
                  <span className="whitespace-pre-line">{ctx.tx(p.address)}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </Reveal>
      </Section>
    );
  },

  contact_form(s, ctx) {
    const p = s.props;
    return <ContactForm neverAsk={ctx.tx(p.never_ask)} title={ctx.tx(p.title)} intro={ctx.tx(p.intro)} />;
  },

  workshops(s, ctx) {
    const p = s.props;
    const slug = (ctx.page && ctx.page.slug) || "";
    const calendar = layoutOf(s) === "calendar" || (!layoutOf(s) && /(^|\/)resources$/.test(slug));
    if (calendar) {
      return (
        <Section>
          <EventsCalendar title={ctx.tx(p.title)} />
        </Section>
      );
    }
    return <WorkshopsPanel formTitle={ctx.tx(p.title)} />;
  },

  apply_wizard() {
    return <ApplyWizard />;
  },
};

/* ---------------------------------------------------------------------------------------------- layouts of types in sections.jsx
   Each returns JSX for the layouts drawn here, or null to let sections.jsx draw the default. */
export const VARIANTS = {
  feature_cards(s, ctx) {
    const p = s.props;
    const items = (p.items || []).filter(Boolean);
    let l = layoutOf(s);
    if ((!l || /-columns$/.test(l)) && items.some((it) => (it.points || []).length)) l = "cascade"; // points mean the broker cascade, whatever layout an older import carries
    const head = ctx.tx(p.title) ? <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} /> : null;

    if (l === "cascade") {
      const OFFSETS = ["", "md:translate-y-8", "md:translate-y-16"];
      return (
        <Section>
          {head}
          <div className={`${head ? "mt-10 " : ""}grid gap-6 md:grid-cols-3 md:pb-16`}>
            {items.map((it, i) => {
              const Icon = ICONS[it.icon];
              return (
                <Reveal key={i} delay={i * 0.1}>
                  <article className={`card h-full border-t-2 border-t-gold p-7 ${OFFSETS[i] || ""}`}>
                    <div className="flex items-center justify-between">
                      {Icon ? (
                        <span className="inline-flex rounded-[7px] bg-surface-3 p-2.5 text-gold-text" aria-hidden="true">
                          <Icon className="h-5 w-5" />
                        </span>
                      ) : <span />}
                      <span className="text-3xl font-bold text-gold/40" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold">{ctx.tx(it.title)}</h2>
                    {ctx.tx(it.text) ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ctx.tx(it.text)}</p> : null}
                    {(it.points || []).length ? (
                      <div className="mt-4">
                        <CheckList items={texts(it.points, ctx)} />
                      </div>
                    ) : null}
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Section>
      );
    }

    if (l === "ledger") {
      return (
        <Section className="!pt-0">
          {head}
          <div className={`${head ? "mt-10 " : ""}divide-y divide-border border-y border-border`}>
            {items.map((it, i) => {
              const Icon = ICONS[it.icon];
              return (
                <Reveal key={i}>
                  <div className="grid items-start gap-4 py-8 sm:grid-cols-[1fr_2fr] sm:gap-10">
                    <h3 className="flex items-center gap-3 text-lg font-semibold">
                      {Icon ? (
                        <span className="inline-flex rounded-[7px] bg-surface-3 p-2 text-gold-text" aria-hidden="true">
                          <Icon className="h-5 w-5" />
                        </span>
                      ) : null}
                      {ctx.tx(it.title)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:pt-2">{ctx.tx(it.text)}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Section>
      );
    }

    if (l === "milestones") {
      return (
        <Section className="!pt-0">
          {head}
          <div className={`${head ? "mt-10 " : ""}grid gap-6 sm:grid-cols-2`}>
            {items.map((it, i) => {
              const Icon = ICONS[it.icon];
              const gold = i % 2 === 1;
              return (
                <Reveal key={i} delay={i * 0.12}>
                  <article className={gold ? "h-full rounded-[10px] bg-[#c9a84c] p-8" : "card h-full p-8"}>
                    {Icon ? <Icon className={`h-6 w-6 ${gold ? "text-[#0a0e18]" : "text-gold-text"}`} aria-hidden="true" /> : null}
                    <h3 className={`mt-4 text-xl font-semibold ${gold ? "text-[#0a0e18]" : ""}`}>{ctx.tx(it.title)}</h3>
                    <p className={`mt-3 text-sm leading-relaxed ${gold ? "text-[#0a0e18]/85" : "text-muted-foreground"}`}>{ctx.tx(it.text)}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Section>
      );
    }

    if (l === "panels") {
      return (
        <Section>
          {head}
          <div className={`${head ? "mt-10 " : ""}space-y-8`}>
            {items.map((it, i) => {
              const Icon = ICONS[it.icon];
              return (
                <Reveal key={i}>
                  <article className={`card flex flex-col gap-5 p-8 sm:flex-row sm:items-start sm:gap-8 ${i % 2 ? "lg:ml-20" : "lg:mr-20"}`}>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-center">
                      <span className="text-3xl font-bold text-gold/50" aria-hidden="true">{String.fromCharCode(65 + (i % 26))}</span>
                      {Icon ? (
                        <span className="inline-flex rounded-[7px] bg-surface-3 p-3 text-gold-text" aria-hidden="true">
                          <Icon className="h-6 w-6" />
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold sm:text-2xl">{ctx.tx(it.title)}</h2>
                      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{ctx.tx(it.text)}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
          {ctx.tx(p.note) ? (
            <Reveal>
              <p className="mx-auto mt-12 max-w-2xl rounded-[10px] border border-gold/30 bg-surface-2 px-5 py-4 text-center text-sm font-medium text-body">{ctx.tx(p.note)}</p>
            </Reveal>
          ) : null}
        </Section>
      );
    }
    return null;
  },

  steps(s, ctx) {
    const p = s.props;
    const items = (p.items || []).filter(Boolean);
    let l = layoutOf(s);
    const hasText = items.some((it) => ctx.tx(it.text));
    const allText = items.length > 0 && items.every((it) => ctx.tx(it.text));
    if (!l || l === "numbered") {
      if (!hasText && items.length) l = "ruled"; // steps that are a single sentence each
      else if (allText && !ctx.tx(p.title)) l = "beliefs"; // an untitled list of beliefs
    }
    const head = ctx.tx(p.title) ? <SectionTitle title={ctx.tx(p.title)} subtitle={ctx.tx(p.intro)} /> : null;

    if (l === "ruled") {
      return (
        <Section className="!pt-0">
          {head}
          <ol className={`${head ? "mt-10 " : ""}grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3`}>
            {items.map((it, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <li className="h-full border-t-2 border-gold/40 pt-5">
                  <span className="text-5xl font-bold text-gold/30" aria-hidden="true">{i + 1}</span>
                  {ctx.tx(it.text) ? <h3 className="mt-3 text-base font-semibold">{ctx.tx(it.title)}</h3> : null}
                  <p className={`${ctx.tx(it.text) ? "mt-1.5" : "mt-3"} text-sm leading-relaxed text-body`}>{ctx.tx(it.text) || ctx.tx(it.title)}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Section>
      );
    }

    if (l === "beliefs") {
      return (
        <Section>
          {head}
          <ol className={`${head ? "mt-10 " : ""}space-y-16`}>
            {items.map((it, i) => (
              <Reveal key={i}>
                <li className="grid items-start gap-6 sm:grid-cols-[160px_1fr] sm:gap-12">
                  <span className="select-none text-7xl font-bold leading-none text-gold/25 sm:text-8xl" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <div className="border-l-2 border-gold/50 pl-6 sm:pl-8">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{ctx.tx(it.title)}</h2>
                    <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{ctx.tx(it.text)}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </Section>
      );
    }

    if (l === "roman") {
      return (
        <Section className="!pt-0">
          {head}
          <div className={`${head ? "mt-10 " : ""}divide-y divide-border border-y border-border`}>
            {items.map((it, i) => (
              <Reveal key={i}>
                <div className="grid items-baseline gap-3 py-8 sm:grid-cols-[110px_220px_1fr] sm:gap-8">
                  <span className="text-4xl font-bold tracking-wide text-gold/50" aria-hidden="true">{toRoman(i + 1)}</span>
                  <h3 className="text-xl font-semibold">{ctx.tx(it.title)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{ctx.tx(it.text)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      );
    }
    return null;
  },

  rich_text(s, ctx) {
    const p = s.props;
    const body = ctx.tx(p.body);
    const l = layoutOf(s);

    if (l === "callout") {
      return (
        <Section className="!pt-0">
          <Reveal>
            <div className="card flex flex-col gap-4 p-7 sm:flex-row sm:items-start">
              <span className="inline-flex w-fit rounded-[7px] bg-surface-3 p-2.5 text-gold-text" aria-hidden="true">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                {ctx.tx(p.title) ? <h2 className="text-xl font-semibold">{ctx.tx(p.title)}</h2> : null}
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground [&_a]:text-gold-text" dangerouslySetInnerHTML={rich(body)} />
              </div>
            </div>
          </Reveal>
        </Section>
      );
    }

    if (l === "columns") {
      const paras = body.match(/<p[\s>][\s\S]*?<\/p>/g) || [];
      const cols = paras.length >= 2 ? [paras.slice(0, Math.ceil(paras.length / 2)).join(""), paras.slice(Math.ceil(paras.length / 2)).join("")] : [body];
      return (
        <Section>
          {ctx.tx(p.title) ? <SectionTitle title={ctx.tx(p.title)} /> : null}
          <div className={`${ctx.tx(p.title) ? "mt-8 " : ""}grid gap-10 ${cols.length > 1 ? "md:grid-cols-2" : ""}`}>
            {cols.map((html, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className={`space-y-4 text-lg leading-relaxed text-body [&_a]:text-gold-text ${i === 1 ? "md:pt-10" : ""}`} dangerouslySetInnerHTML={rich(html)} />
              </Reveal>
            ))}
          </div>
        </Section>
      );
    }

    if (/<blockquote[\s>]/i.test(body)) {
      /* A pull quote: the title is the small gold label, the quote sits under a gold rule. */
      return (
        <Section>
          <Reveal>
            {ctx.tx(p.title) ? <p className="eyebrow">{ctx.tx(p.title)}</p> : null}
            <div
              className="mt-5 max-w-3xl [&_blockquote]:border-l-4 [&_blockquote]:border-gold [&_blockquote]:pl-6 sm:[&_blockquote]:pl-8 [&_blockquote_p]:text-2xl [&_blockquote_p]:font-semibold [&_blockquote_p]:leading-snug [&_blockquote_p]:text-cream sm:[&_blockquote_p]:text-3xl"
              dangerouslySetInnerHTML={rich(body)}
            />
          </Reveal>
        </Section>
      );
    }
    return null;
  },

  cta_band(s, ctx) {
    const p = s.props;
    const l = layoutOf(s);
    const list = (p.buttons || []).filter((b) => b && b.url);

    if (l === "gold") {
      return (
        <section className="bg-[#c9a84c]">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0a0e18] sm:text-3xl">{ctx.tx(p.title)}</h2>
            {ctx.tx(p.text) ? <p className="mt-3 max-w-xl text-[#0a0e18]/80">{ctx.tx(p.text)}</p> : null}
            {list.length ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {list.map((b, i) => (
                  <CmsLink key={i} url={b.url} className={i === 0 ? "btn !bg-[#0a0e18] !text-[#d8b95a] hover:!bg-[#162036]" : "btn border !border-[#0a0e18]/50 !text-[#0a0e18] hover:!border-[#0a0e18]"}>
                    {i === 0 && /^\/workshops/.test(b.url) ? <CalendarDays className="h-4 w-4" aria-hidden="true" /> : null}
                    {ctx.tx(b.label)}
                    {i === 0 && /^\/workshops/.test(b.url) ? null : <Arrow />}
                  </CmsLink>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      );
    }

    if (l === "split") {
      return (
        <Section>
          <Reveal>
            <div className="card relative flex flex-col items-start justify-between gap-8 overflow-hidden bg-surface-2 p-8 sm:p-12 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{ctx.tx(p.title)}</h2>
                {ctx.tx(p.text) ? <p className="mt-3 text-muted-foreground">{ctx.tx(p.text)}</p> : null}
              </div>
              <Buttons list={p.buttons} ctx={ctx} className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col" />
            </div>
          </Reveal>
        </Section>
      );
    }
    return null;
  },
};
