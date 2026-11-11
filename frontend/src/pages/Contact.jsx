import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import Seo from "../components/Seo";
import { PageBanner, Section } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { apiFetch, apiPath } from "../lib/api";
import { IMAGES } from "../lib/images";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", preferred_language: lang, path_interest: "unsure", message: "", consent: false, website: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const path = params.get("path");
    if (path === "purchase" || path === "refinance") setForm((f) => ({ ...f, path_interest: path }));
  }, [params]);

  useEffect(() => {
    setForm((f) => ({ ...f, preferred_language: lang }));
  }, [lang]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = t("common.errorNameRequired");
    if (!form.email.trim() && !form.phone.trim()) next.contact = t("common.errorContactRequired");
    else if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) next.email = t("common.errorEmailInvalid");
    if (!form.consent) next.consent = t("common.errorConsentRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await apiFetch(apiPath.leads, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          preferred_language: form.preferred_language,
          path_interest: form.path_interest,
          message: form.message,
          consent: form.consent,
          website: form.website,
          page: window.location.pathname,
          referrer: document.referrer || "",
          campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
        }),
      });
      if (res.status === 429) throw new Error(t("common.errorRateLimited"));
      if (!res.ok) throw new Error(t("contact.form.error"));
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || t("common.errorGeneric"));
    }
  }

  return (
    <>
      <Seo pageKey="contact" />
      <PageBanner image={IMAGES.contact} alt={t("banners.contact.alt")} eyebrow={t("nav.contact")} title={t("contact.title")} intro={t("contact.intro")} caption={t("banners.contact.caption")} icon={Mail} testid="banner-contact" variant="slim" />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="flex max-w-md items-start gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-text" aria-hidden="true" />
              {t("contact.neverAsk")}
            </p>
          </div>
          <div className="card bg-surface-2 p-7 shadow-xl sm:p-9">
            {status === "success" ? (
              <div role="status" data-testid="contact-success" className="rounded-[10px] border border-green/50 bg-surface p-6 text-center">
                <h2 className="text-xl font-semibold text-green">{t("contact.form.success")}</h2>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="grid gap-5">
                  <div>
                    <label htmlFor="ct-name" className="field-label">{t("contact.form.nameLabel")}</label>
                    <input id="ct-name" data-testid="contact-name" className="input" value={form.name} onChange={set("name")} maxLength={120} autoComplete="name" aria-invalid={!!errors.name} />
                    {errors.name && <p role="alert" className="field-error" data-testid="contact-error-name">{errors.name}</p>}
                  </div>
                  <p className="text-xs text-dim">{t("contact.form.contactNote")}</p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ct-email" className="field-label">{t("contact.form.emailLabel")}</label>
                      <input id="ct-email" data-testid="contact-email" type="email" className="input" value={form.email} onChange={set("email")} autoComplete="email" aria-invalid={!!(errors.email || errors.contact)} />
                      {errors.email && <p role="alert" className="field-error" data-testid="contact-error-email">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="ct-phone" className="field-label">{t("contact.form.phoneLabel")}</label>
                      <input id="ct-phone" data-testid="contact-phone" type="tel" className="input" value={form.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" aria-invalid={!!errors.contact} />
                    </div>
                  </div>
                  {errors.contact && <p role="alert" className="field-error" data-testid="contact-error-contact">{errors.contact}</p>}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ct-lang" className="field-label">{t("contact.form.languageLabel")}</label>
                      <select id="ct-lang" data-testid="contact-language" className="input" value={form.preferred_language} onChange={set("preferred_language")}>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ct-path" className="field-label">{t("contact.form.pathLabel")}</label>
                      <select id="ct-path" data-testid="contact-path" className="input" value={form.path_interest} onChange={set("path_interest")}>
                        <option value="purchase">{t("contact.form.pathPurchase")}</option>
                        <option value="refinance">{t("contact.form.pathRefinance")}</option>
                        <option value="unsure">{t("contact.form.pathUnsure")}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ct-message" className="field-label">{t("contact.form.messageLabel")}</label>
                    <textarea id="ct-message" data-testid="contact-message" className="input min-h-28 resize-y" value={form.message} onChange={set("message")} maxLength={2000} placeholder={t("contact.form.messagePlaceholder")} />
                  </div>
                  <div className="flex items-start gap-3">
                    <input id="ct-consent" data-testid="contact-consent" type="checkbox" checked={form.consent} onChange={set("consent")} className="mt-1 h-4 w-4 shrink-0 accent-[#c9a84c]" aria-invalid={!!errors.consent} />
                    <label htmlFor="ct-consent" className="text-sm text-body">{t("contact.form.consentLabel")}</label>
                  </div>
                  {errors.consent && <p role="alert" className="field-error" data-testid="contact-error-consent">{errors.consent}</p>}
                  <div className="honeypot" aria-hidden="true">
                    <label htmlFor="ct-website">Website</label>
                    <input id="ct-website" data-testid="contact-honeypot" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
                  </div>
                  {status === "error" && <p role="alert" className="field-error" data-testid="contact-error">{errorMsg}</p>}
                  <button type="submit" data-testid="contact-submit" className="btn-primary" disabled={status === "sending"}>
                    {status === "sending" ? t("common.sending") : t("contact.form.submit")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
