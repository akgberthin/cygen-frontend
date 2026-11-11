import React, { useEffect, useState } from "react";
import { CalendarDays, Clock, GraduationCap, MapPin } from "lucide-react";
import Seo from "../components/Seo";
import { PageBanner, Reveal, Section, SectionTitle } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { apiFetch, apiPath, apiUrl } from "../lib/api";
import { IMAGES } from "../lib/images";

export default function Workshops() {
  const { t, lang } = useI18n();
  const [workshops, setWorkshops] = useState([]);
  const [form, setForm] = useState({ workshop_id: "", name: "", email: "", phone: "", preferred_language: lang, website: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(apiUrl(apiPath.workshops))
      .then((r) => r.json())
      .then((data) => {
        setWorkshops(data.workshops || []);
        if (data.workshops?.length) setForm((f) => ({ ...f, workshop_id: f.workshop_id || data.workshops[0].id }));
      })
      .catch(() => setWorkshops([]));
  }, []);

  useEffect(() => {
    setForm((f) => ({ ...f, preferred_language: lang }));
  }, [lang]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await apiFetch(apiPath.registrations, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          preferred_language: form.preferred_language,
          website: form.website,
        }),
      }, form.workshop_id);
      if (res.status === 429) throw new Error(t("common.errorRateLimited"));
      if (!res.ok) throw new Error(t("workshops.form.error"));
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || t("common.errorGeneric"));
    }
  }

  const locale = lang === "es" ? "es-ES" : "en-US";
  const dateParts = (iso) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return {
      day: new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone: "UTC" }).format(d),
      month: new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(d),
      year: new Intl.DateTimeFormat(locale, { year: "numeric", timeZone: "UTC" }).format(d),
    };
  };

  return (
    <>
      <Seo pageKey="workshops" />
      <PageBanner image={IMAGES.workshops} alt={t("banners.workshops.alt")} eyebrow={t("nav.workshops")} title={t("workshops.title")} intro={t("workshops.intro")} caption={t("banners.workshops.caption")} icon={GraduationCap} testid="banner-workshops" variant="ticket" />

      {/* Identity: an agenda — ticket-style date rows with a sticky registration rail */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <ol className="space-y-5">
            {workshops.map((w, i) => {
              const copy = t(`workshops.items.${w.id}`);
              const full = w.spots_left <= 0;
              const dp = dateParts(w.date);
              return (
                <Reveal key={w.id} delay={i * 0.08}>
                  <li className="card flex gap-5 p-5 transition-colors hover:border-gold/50 sm:p-6" data-testid={`workshop-${w.id}`}>
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center self-start rounded-[10px] border border-gold/40 bg-surface-2 px-2 py-3" aria-hidden="true">
                      <span className="text-2xl font-bold leading-none text-gold-text">{dp.day}</span>
                      <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{dp.month}</span>
                      <span className="text-[10px] text-dim">{dp.year}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold">{copy.title}</h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{copy.desc}</p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-body">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gold-text" aria-hidden="true" />
                          {w.time} UTC · {w.duration_minutes} {t("workshops.durationLabel")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gold-text" aria-hidden="true" />
                          {w.mode === "in-person" ? w.location : t("workshops.modeOnline")}
                        </span>
                        <span className={`flex items-center gap-1.5 font-semibold ${full ? "text-danger" : "text-green"}`} data-testid={`workshop-spots-${w.id}`}>
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {full ? t("workshops.full") : `${w.spots_left} ${t("workshops.spotsLeft")}`}
                        </span>
                      </div>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ol>

          <div>
            <div className="card bg-surface-2 p-6 sm:p-7 lg:sticky lg:top-24">
              {status === "success" ? (
                <div role="status" data-testid="workshop-success" className="rounded-[10px] border border-green/50 bg-surface p-6 text-center">
                  <h2 className="text-xl font-semibold text-green">{t("workshops.form.success")}</h2>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <SectionTitle title={t("workshops.form.title")} />
                  <div className="mt-6 grid gap-5">
                    <div>
                      <label htmlFor="ws-workshop" className="field-label">{t("workshops.form.workshopLabel")}</label>
                      <select id="ws-workshop" data-testid="workshop-select" className="input" value={form.workshop_id} onChange={set("workshop_id")} required>
                        {workshops.map((w) => {
                          const dp = dateParts(w.date);
                          return (
                            <option key={w.id} value={w.id} disabled={w.spots_left <= 0}>
                              {t(`workshops.items.${w.id}.title`)} — {dp.day} {dp.month} {dp.year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ws-name" className="field-label">{t("workshops.form.nameLabel")}</label>
                      <input id="ws-name" data-testid="workshop-name" className="input" value={form.name} onChange={set("name")} required maxLength={120} autoComplete="name" />
                    </div>
                    <div>
                      <label htmlFor="ws-email" className="field-label">{t("workshops.form.emailLabel")}</label>
                      <input id="ws-email" data-testid="workshop-email" type="email" className="input" value={form.email} onChange={set("email")} required autoComplete="email" />
                    </div>
                    <div>
                      <label htmlFor="ws-phone" className="field-label">
                        {t("workshops.form.phoneLabel")} <span className="text-dim">({t("common.optional")})</span>
                      </label>
                      <input id="ws-phone" data-testid="workshop-phone" type="tel" className="input" value={form.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" />
                    </div>
                    <div>
                      <label htmlFor="ws-lang" className="field-label">{t("workshops.form.languageLabel")}</label>
                      <select id="ws-lang" data-testid="workshop-language" className="input" value={form.preferred_language} onChange={set("preferred_language")}>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className="honeypot" aria-hidden="true">
                      <label htmlFor="ws-website">Website</label>
                      <input id="ws-website" data-testid="workshop-honeypot" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
                    </div>
                    {status === "error" && (
                      <p role="alert" data-testid="workshop-error" className="field-error">{errorMsg}</p>
                    )}
                    <button type="submit" data-testid="workshop-submit" className="btn-primary" disabled={status === "sending" || !workshops.length}>
                      {status === "sending" ? t("common.sending") : t("workshops.form.submit")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
