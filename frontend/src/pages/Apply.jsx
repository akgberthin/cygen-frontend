import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bot, KeyRound, PhoneCall, RefreshCcw, Send, X } from "lucide-react";
import Seo from "../components/Seo";
import { Section, TypeBanner } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { apiFetch, apiPath } from "../lib/api";
import { localizedPath } from "../lib/links";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DECLINED_ROUTES = new Set(["eligibility_or_advice", "wants_person", "off_topic", "injection"]);

export function Concierge({ path, step, scenario }) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showPerson, setShowPerson] = useState(false);
  const declinedRef = useRef(0);
  const listRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("concierge.welcome") }]);
    setFailed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const history = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(apiPath.concierge, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12), lang, path: path || null, step, scenario: scenario?.figures || null }),
      });
      if (!res.ok || !res.body) throw new Error("concierge failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error("stream error");
          if (parsed.route && DECLINED_ROUTES.has(parsed.route)) {
            declinedRef.current += parsed.route === "wants_person" ? 2 : 1;
            if (declinedRef.current >= 2) setShowPerson(true);
          }
          if (parsed.delta) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + parsed.delta };
              return copy;
            });
          }
        }
      }
    } catch (e) {
      declinedRef.current += 1;
      if (declinedRef.current >= 2) setShowPerson(true);
      setFailed(true);
      setMessages((m) => m.filter((msg, i) => !(i === m.length - 1 && msg.role === "assistant" && msg.content === "")));
    } finally {
      setBusy(false);
    }
  }

  const chips = t("concierge.chips");
  const onlyWelcome = messages.length <= 1;

  return (
    <aside className="card flex h-full flex-col bg-surface-2 p-5 sm:p-6 lg:sticky lg:top-24" data-testid="concierge">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="inline-flex rounded-[7px] bg-gold p-2 text-ink" aria-hidden="true">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{t("concierge.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("concierge.subtitle")}</p>
        </div>
      </div>

      <div ref={listRef} className="mt-4 h-72 flex-1 space-y-3 overflow-y-auto pr-1" data-testid="concierge-messages" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] rounded-[10px] px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-gold text-ink" : "border border-border bg-surface text-body"
            }`}>
              {m.content}
              {busy && i === messages.length - 1 && m.role === "assistant" && !m.content && (
                <span className="text-dim">{t("concierge.thinking")}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {failed && <p role="alert" className="mt-3 text-xs text-danger" data-testid="concierge-error">{t("concierge.error")}</p>}

      {showPerson && (
        <a href={localizedPath(lang, "contact")} data-testid="concierge-talk-to-person" className="btn-outline mt-3 w-full !py-2 text-xs">
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          {t("concierge.talkToPerson")}
        </a>
      )}

      {onlyWelcome && !busy && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <button
              key={chip}
              type="button"
              data-testid={`concierge-chip-${i}`}
              onClick={() => send(chip)}
              className="rounded-full border border-input px-3 py-1.5 text-xs font-medium text-body transition-colors hover:border-gold hover:text-gold-text"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="input"
          data-testid="concierge-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("concierge.placeholder")}
          maxLength={500}
          aria-label={t("concierge.placeholder")}
        />
        <button type="submit" data-testid="concierge-send" className="btn-primary !px-3.5" disabled={busy || !input.trim()} aria-label={t("concierge.send")}>
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </aside>
  );
}

export default function Apply() {
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [scenario, setScenario] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("cygen_scenario"));
    } catch (e) {
      return null;
    }
  });
  const [data, setData] = useState({
    path: "", city: "", homeValue: "", existing: "", share: "",
    firstName: "", lastName: "", email: "", phone: "", address: "", language: lang, consent: false, website: "",
  });

  useEffect(() => {
    const p = params.get("path");
    if (p === "purchase" || p === "refinance") setData((d) => ({ ...d, path: p }));
    const price = Number(params.get("price"));
    const share = Number(params.get("share"));
    setData((d) => ({
      ...d,
      homeValue: Number.isFinite(price) && price > 0 ? String(Math.round(price)) : d.homeValue,
      share: Number.isFinite(share) && share > 0 && share <= 100 ? String(share) : d.share,
    }));
  }, [params]);

  useEffect(() => {
    // Calculator scenario fallback prefill when no URL params were used
    const f = scenario?.figures;
    if (!f) return;
    setData((d) => ({
      ...d,
      path: d.path || f.path || d.path,
      homeValue: d.homeValue || (f.home_value ? String(f.home_value) : d.homeValue),
      share: d.share || (f.equity_in_pct != null ? String(f.equity_in_pct) : d.share),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setData((d) => ({ ...d, language: lang }));
  }, [lang]);

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function validate(current) {
    const next = {};
    if (current === 1 && !data.path) next.path = t("apply.pathQ");
    if (current === 2) {
      if (!data.homeValue || Number(data.homeValue) <= 0) next.homeValue = t("apply.homeValue");
      if (data.path === "refinance" && (!data.existing || Number(data.existing) <= 0)) next.existing = t("apply.existing");
      if (data.path === "purchase" && (!data.share || Number(data.share) <= 0 || Number(data.share) > 100)) next.share = t("apply.share");
    }
    if (current === 3) {
      if (!data.firstName.trim()) next.firstName = t("common.errorFirstNameRequired");
      if (!data.lastName.trim()) next.lastName = t("common.errorLastNameRequired");
      if (!data.email.trim()) next.email = t("common.errorEmailRequired");
      else if (!EMAIL_RE.test(data.email.trim())) next.email = t("common.errorEmailInvalid");
      if (!data.phone.trim()) next.phone = t("common.errorPhoneRequired");
      if (!data.address.trim()) next.address = t("common.errorAddressRequired");
      if (!data.consent) next.consent = t("common.errorConsentRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (validate(step)) setStep((s) => Math.min(3, s + 1));
  }

  async function submit() {
    if (!validate(3)) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await apiFetch(apiPath.applications, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          preferred_language: data.language,
          path: data.path,
          city: data.city.trim(),
          home_value: data.homeValue ? Number(data.homeValue) : null,
          existing_financing: data.existing ? Number(data.existing) : null,
          initial_share: data.share ? Number(data.share) : null,
          scenario_id: scenario?.id || null,
          consent: data.consent,
          website: data.website,
        }),
      });
      if (res.status === 429) throw new Error(t("common.errorRateLimited"));
      if (!res.ok) throw new Error(t("apply.error"));
      const body = await res.json();
      // Automated flow: open the account at once with the details just given —
      // no "application received" card, the concierge leads the remaining setup.
      sessionStorage.setItem("cygen_application", JSON.stringify({
        ref: body.application_ref || null,
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        language: data.language,
      }));
      navigate(`/${lang}/register`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || t("common.errorGeneric"));
    }
  }

  const steps = [t("apply.step1"), t("apply.step2"), t("apply.step3")];
  const pathCards = [
    { id: "purchase", Icon: KeyRound, title: t("apply.pathPurchase"), desc: t("apply.pathPurchaseDesc"), testid: "apply-path-purchase" },
    { id: "refinance", Icon: RefreshCcw, title: t("apply.pathRefinance"), desc: t("apply.pathRefinanceDesc"), testid: "apply-path-refinance" },
  ];

  return (
    <>
      <Seo pageKey="apply" />
      <TypeBanner eyebrow="CYGEN" title={t("apply.title")} intro={t("apply.intro")} ghost={t("common.apply")} testid="banner-apply" />

      <Section>
        {scenario?.figures && (
          <div className="card mb-8 border-gold/40 bg-surface-2 p-5" data-testid="apply-your-numbers">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">{t("apply.numbers.title")}</h2>
              <button
                type="button"
                className="btn-outline !px-3 !py-1.5 text-xs"
                data-testid="apply-numbers-clear"
                onClick={() => {
                  sessionStorage.removeItem("cygen_scenario");
                  setScenario(null);
                }}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("apply.numbers.clear")}
              </button>
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {[
                ["homeValue", scenario.figures.home_value, true],
                ["share", scenario.figures.equity_in_pct != null ? `${scenario.figures.equity_in_pct}%` : null],
                ["rate", scenario.figures.cop_rate_pct != null ? `${scenario.figures.cop_rate_pct}%` : null],
                ["cop", scenario.figures.cop, true],
                ["equity", scenario.figures.equity_payment, true],
                ["completion", scenario.figures.completion_months || null],
                ["ownership", scenario.figures.ownership_pct != null ? `${scenario.figures.ownership_pct}%` : null],
              ].filter(([, v]) => v != null && v !== 0).map(([key, v, isMoney]) => (
                <div key={key} className="flex items-baseline gap-2">
                  <dt className="text-muted-foreground">{t(`apply.numbers.${key}`)}:</dt>
                  <dd className="font-semibold tabular-nums text-cream">
                    {isMoney ? new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v) : v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-dim">{t("apply.numbers.note")}</p>
          </div>
        )}
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="card bg-surface-2 p-6 sm:p-9" data-testid="apply-wizard">
            <>
                <ol className="flex items-center gap-2" aria-label="Progress">
                  {steps.map((label, i) => (
                    <li key={label} className="flex flex-1 flex-col gap-1.5">
                      <span className={`h-1.5 rounded-full transition-colors ${step > i ? "bg-gold" : "bg-surface-3"}`} aria-hidden="true" />
                      <span className={`text-xs font-semibold ${step > i ? "text-gold-text" : "text-dim"}`}>
                        {i + 1}. {label}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={reduce ? false : { opacity: 0, x: 32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduce ? undefined : { opacity: 0, x: -24 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {step === 1 && (
                        <fieldset>
                          <legend className="text-lg font-semibold">{t("apply.pathQ")}</legend>
                          <div className="mt-5 grid gap-4 sm:grid-cols-2" role="radiogroup">
                            {pathCards.map(({ id, Icon, title, desc, testid }) => (
                              <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={data.path === id}
                                data-testid={testid}
                                onClick={() => setData((d) => ({ ...d, path: id }))}
                                className={`card p-5 text-left transition-colors ${data.path === id ? "border-gold bg-surface-3" : "hover:border-gold/50"}`}
                              >
                                <span className={`inline-flex rounded-[7px] p-2.5 ${data.path === id ? "bg-gold text-ink" : "bg-surface-3 text-gold-text"}`} aria-hidden="true">
                                  <Icon className="h-5 w-5" />
                                </span>
                                <span className="mt-3 block text-base font-semibold">{title}</span>
                                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{desc}</span>
                              </button>
                            ))}
                          </div>
                          {errors.path && <p role="alert" className="field-error" data-testid="apply-error-path">{errors.path}</p>}
                          <p className="mt-4 text-xs text-dim">{t("apply.switchNote")}</p>
                        </fieldset>
                      )}

                      {step === 2 && (
                        <div className="grid gap-5">
                          <div>
                            <label htmlFor="ap-city" className="field-label">{t("apply.city")}</label>
                            <input id="ap-city" data-testid="apply-city" className="input" value={data.city} onChange={set("city")} maxLength={120} />
                          </div>
                          <div>
                            <label htmlFor="ap-value" className="field-label">{t("apply.homeValue")}</label>
                            <input id="ap-value" data-testid="apply-home-value" type="number" min="0" className="input" value={data.homeValue} onChange={set("homeValue")} aria-invalid={!!errors.homeValue} />
                            {errors.homeValue && <p role="alert" className="field-error" data-testid="apply-error-value">{errors.homeValue}</p>}
                            <p className="mt-1.5 text-xs text-dim">{t("apply.homeValueNote")}</p>
                          </div>
                          {data.path === "refinance" && (
                            <div>
                              <label htmlFor="ap-existing" className="field-label">{t("apply.existing")}</label>
                              <input id="ap-existing" data-testid="apply-existing" type="number" min="0" className="input" value={data.existing} onChange={set("existing")} aria-invalid={!!errors.existing} />
                              {errors.existing && <p role="alert" className="field-error" data-testid="apply-error-existing">{errors.existing}</p>}
                            </div>
                          )}
                          {data.path === "purchase" && (
                            <div>
                              <label htmlFor="ap-share" className="field-label">{t("apply.share")}</label>
                              <input id="ap-share" data-testid="apply-share" type="number" min="1" max="100" className="input" value={data.share} onChange={set("share")} aria-invalid={!!errors.share} />
                              {errors.share && <p role="alert" className="field-error" data-testid="apply-error-share">{errors.share}</p>}
                            </div>
                          )}
                        </div>
                      )}

                      {step === 3 && (
                        <div className="grid gap-5">
                          <h2 className="text-lg font-semibold">{t("apply.reviewTitle")}</h2>
                          <p className="rounded-[7px] border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                            {data.path === "purchase" ? t("apply.pathPurchase") : t("apply.pathRefinance")}
                            {data.city ? ` · ${data.city}` : ""}
                            {data.homeValue ? ` · ${Number(data.homeValue).toLocaleString()}` : ""}
                          </p>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <label htmlFor="ap-first-name" className="field-label">{t("contact.form.firstNameLabel")}</label>
                              <input id="ap-first-name" data-testid="apply-first-name" className="input" value={data.firstName} onChange={set("firstName")} maxLength={80} autoComplete="given-name" aria-invalid={!!errors.firstName} />
                              {errors.firstName && <p role="alert" className="field-error" data-testid="apply-error-first-name">{errors.firstName}</p>}
                            </div>
                            <div>
                              <label htmlFor="ap-last-name" className="field-label">{t("contact.form.lastNameLabel")}</label>
                              <input id="ap-last-name" data-testid="apply-last-name" className="input" value={data.lastName} onChange={set("lastName")} maxLength={80} autoComplete="family-name" aria-invalid={!!errors.lastName} />
                              {errors.lastName && <p role="alert" className="field-error" data-testid="apply-error-last-name">{errors.lastName}</p>}
                            </div>
                          </div>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <label htmlFor="ap-email" className="field-label">{t("contact.form.emailLabel")}</label>
                              <input id="ap-email" data-testid="apply-email" type="email" className="input" value={data.email} onChange={set("email")} autoComplete="email" aria-invalid={!!errors.email} />
                              {errors.email && <p role="alert" className="field-error" data-testid="apply-error-email">{errors.email}</p>}
                            </div>
                            <div>
                              <label htmlFor="ap-phone" className="field-label">{t("contact.form.phoneLabelRequired")}</label>
                              <input id="ap-phone" data-testid="apply-phone" type="tel" className="input" value={data.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" aria-invalid={!!errors.phone} />
                              {errors.phone && <p role="alert" className="field-error" data-testid="apply-error-phone">{errors.phone}</p>}
                            </div>
                          </div>
                          <div>
                            <label htmlFor="ap-address" className="field-label">{t("contact.form.addressLabel")}</label>
                            <input id="ap-address" data-testid="apply-address" className="input" value={data.address} onChange={set("address")} maxLength={200} autoComplete="street-address" aria-invalid={!!errors.address} />
                            {errors.address && <p role="alert" className="field-error" data-testid="apply-error-address">{errors.address}</p>}
                          </div>
                          <p className="text-xs text-dim" data-testid="apply-contact-note">{t("apply.contactNote")}</p>
                          <div>
                            <label htmlFor="ap-lang" className="field-label">{t("contact.form.languageLabel")}</label>
                            <select id="ap-lang" data-testid="apply-language" className="input" value={data.language} onChange={set("language")}>
                              <option value="en">English</option>
                              <option value="es">Español</option>
                            </select>
                          </div>
                          <div className="flex items-start gap-3">
                            <input id="ap-consent" data-testid="apply-consent" type="checkbox" checked={data.consent} onChange={set("consent")} className="mt-1 h-4 w-4 shrink-0 accent-[#c9a84c]" aria-invalid={!!errors.consent} />
                            <label htmlFor="ap-consent" className="text-sm text-body">{t("contact.form.consentLabel")}</label>
                          </div>
                          {errors.consent && <p role="alert" className="field-error" data-testid="apply-error-consent">{errors.consent}</p>}
                          <p className="text-xs text-dim">{t("apply.reviewNote")}</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="ap-website">Website</label>
                  <input id="ap-website" data-testid="apply-honeypot" tabIndex={-1} autoComplete="off" value={data.website} onChange={set("website")} />
                </div>
                {status === "error" && <p role="alert" className="field-error mt-4" data-testid="apply-error">{errorMsg}</p>}

                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    data-testid="apply-back"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="btn-outline"
                    disabled={step === 1}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t("apply.back")}
                  </button>
                  {step < 3 ? (
                    <button type="button" data-testid="apply-next" onClick={goNext} className="btn-primary">
                      {t("apply.next")}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" data-testid="apply-submit" onClick={submit} className="btn-primary" disabled={status === "sending"}>
                      {status === "sending" ? t("common.sending") : t("apply.submit")}
                    </button>
                  )}
                </div>
              </>
          </div>

          <Concierge path={data.path} step={step} scenario={scenario} />
        </div>
      </Section>
    </>
  );
}
