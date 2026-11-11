import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarPlus, Clock3, MapPin, MonitorSmartphone } from "lucide-react";
import Seo from "../components/Seo";
import { CtaBand, PageBanner, Reveal, Section, SectionTitle } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { apiFetch, apiPath } from "../lib/api";
import { IMAGES } from "../lib/images";
import { localizedPath } from "../lib/links";

const TYPE_TINT = { workshop: "var(--c-gold)", webinar: "var(--c-blue)", seminar: "var(--c-green)" };

function eventStart(ev) {
  return new Date(`${ev.date}T${ev.time}:00`);
}

function icsLocal(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function eventMeta(ev, t) {
  const title = t(`workshops.items.${ev.id}.title`);
  const where = ev.mode === "online" ? t("resources.online") : `${t("resources.inPerson")} — ${ev.location}`;
  return { title, where, start: eventStart(ev), end: new Date(eventStart(ev).getTime() + ev.duration_minutes * 60000) };
}

function downloadIcs(ev, title, where) {
  const start = eventStart(ev);
  const end = new Date(start.getTime() + ev.duration_minutes * 60000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CYGEN//Events//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@cygenequities.com`,
    `DTSTAMP:${icsLocal(new Date())}`,
    `DTSTART:${icsLocal(start)}`,
    `DTEND:${icsLocal(end)}`,
    `SUMMARY:CYGEN — ${title}`,
    `LOCATION:${where}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `cygen-${ev.id}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function googleCalendarUrl(ev, title, where) {
  const start = eventStart(ev);
  const end = new Date(start.getTime() + ev.duration_minutes * 60000);
  const q = new URLSearchParams({ action: "TEMPLATE", text: `CYGEN — ${title}`, dates: `${icsLocal(start)}/${icsLocal(end)}`, location: where });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function CalendarActions({ ev, title, where, compact = false }) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      <button type="button" onClick={() => downloadIcs(ev, title, where)} className="btn-outline !px-3 !py-1.5 text-xs" data-testid={`resources-add-ics-${ev.id}`}>
        <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
        {t("resources.addToCalendar")}
      </button>
      <a href={googleCalendarUrl(ev, title, where)} target="_blank" rel="noopener noreferrer" className="btn-outline !px-3 !py-1.5 text-xs" data-testid={`resources-gcal-${ev.id}`}>
        <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
        {t("resources.googleCalendar")}
      </a>
    </div>
  );
}

export default function Resources() {
  const { t, lang } = useI18n();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    apiFetch(apiPath.workshops)
      .then((res) => res.json())
      .then((body) => setEvents(body.workshops || []))
      .catch(() => setEvents([]));
  }, []);

  const upcoming = useMemo(
    () => events.filter((ev) => eventStart(ev) >= new Date(new Date().toDateString())).sort((a, b) => eventStart(a) - eventStart(b)),
    [events]
  );
  const next = upcoming[0];

  const fmtDate = (d) => new Intl.DateTimeFormat(lang, { dateStyle: "full" }).format(d);
  const fmtTime = (d) => new Intl.DateTimeFormat(lang, { timeStyle: "short" }).format(d);

  const cards = [
    { key: "how", path: "how-it-works" },
    { key: "faq", path: "faq" },
    { key: "calc", path: "", hash: "#compare" },
  ];

  return (
    <>
      <Seo pageKey="resources" />
      <PageBanner
        image={IMAGES.about}
        alt={t("banners.resources.alt")}
        eyebrow="CYGEN"
        title={t("resources.title")}
        intro={t("resources.intro")}
        caption={t("banners.resources.caption")}
        testid="banner-resources"
        variant="split"
      />

      <Section>
        {next ? (
          <Reveal>
            <div className="card border-gold/50 bg-surface-2 p-6 sm:p-8" data-testid="resources-next-event">
              <p className="eyebrow !text-gold-text">{t("resources.nextEvent")}</p>
              <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-[10px] border border-gold/40 bg-surface text-center">
                  <span className="text-3xl font-bold tabular-nums text-cream">{eventStart(next).getDate()}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold-text">
                    {new Intl.DateTimeFormat(lang, { month: "short" }).format(eventStart(next))}
                  </span>
                </div>
                <div>
                  <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ background: "var(--c-surface3)", color: TYPE_TINT[next.type] || "var(--c-gold)" }}>
                    {t(`resources.type.${next.type}`)}
                  </span>
                  <h2 className="mt-2 text-2xl font-bold">{t(`workshops.items.${next.id}.title`)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`workshops.items.${next.id}.desc`)}</p>
                  <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-body">
                    <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-gold-text" aria-hidden="true" />{fmtDate(eventStart(next))} · {fmtTime(eventStart(next))} · {next.duration_minutes} min</span>
                    <span className="flex items-center gap-1.5">
                      {next.mode === "online" ? <MonitorSmartphone className="h-4 w-4 text-gold-text" aria-hidden="true" /> : <MapPin className="h-4 w-4 text-gold-text" aria-hidden="true" />}
                      {eventMeta(next, t).where}
                    </span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <CalendarActions ev={next} title={t(`workshops.items.${next.id}.title`)} where={eventMeta(next, t).where} compact />
                    <Link to={localizedPath(lang, "workshops")} className="btn-primary !px-4 !py-2 text-xs" data-testid="resources-register-cta">
                      {t("resources.registerCta")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="resources-no-events">{t("resources.noEvents")}</p>
        )}

        <div className="mt-12">
          <SectionTitle title={t("resources.eventsTitle")} />
          <ul className="mt-8 grid gap-4 md:grid-cols-2" data-testid="resources-events">
            {upcoming.map((ev) => {
              const { title, where, start } = eventMeta(ev, t);
              return (
                <li key={ev.id} className="card bg-surface-2 p-5" data-testid={`resources-event-${ev.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ background: "var(--c-surface3)", color: TYPE_TINT[ev.type] || "var(--c-gold)" }}>
                      {t(`resources.type.${ev.type}`)}
                    </span>
                    <span className="text-xs tabular-nums text-dim">{fmtDate(start)} · {fmtTime(start)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`workshops.items.${ev.id}.desc`)}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-dim">
                    {ev.mode === "online" ? <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
                    {where} · {ev.duration_minutes} min
                  </p>
                  <CalendarActions ev={ev} title={title} where={where} />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-16">
          <SectionTitle title={t("resources.cardsTitle")} />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {cards.map(({ key, path, hash }) => (
              <Reveal key={key}>
                <Link
                  to={`${localizedPath(lang, path)}${hash || ""}`}
                  className="card group flex h-full flex-col bg-surface-2 p-6 transition-colors hover:border-gold/50"
                  data-testid={`resources-card-${key}`}
                >
                  <h3 className="text-lg font-semibold group-hover:text-gold-text">{t(`resources.cards.${key}.title`)}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{t(`resources.cards.${key}.desc`)}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-text">
                    {t("resources.cardCta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand title={t("home.cta.title")} text={t("home.cta.text")} buyLabel={t("home.cta.buy")} bringLabel={t("home.cta.bring")} />
    </>
  );
}
