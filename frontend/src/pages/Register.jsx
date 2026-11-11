import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, UserRound } from "lucide-react";
import Seo from "../components/Seo";
import { Section, TypeBanner } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { apiErrorCode, apiFetch, apiPath } from "../lib/api";
import { localizedPath } from "../lib/links";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const app = JSON.parse(sessionStorage.getItem("cygen_application"));
      if (app) {
        setApplication(app);
        setForm((f) => ({
          ...f,
          firstName: app.firstName || (app.name || "").split(" ")[0] || f.firstName,
          lastName: app.lastName || (app.name || "").split(" ").slice(1).join(" ") || f.lastName,
          email: app.email || f.email,
        }));
      }
    } catch (e) { /* no draft application */ }
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !EMAIL_RE.test(form.email)) return setError(t("account.errorDetails"));
    if (mode === "register") {
      if (form.password.length < 8) return setError(t("account.errorPasswordLength"));
      if (form.password !== form.confirm) return setError(t("account.errorPasswordMatch"));
    }
    setBusy(true);
    try {
      const body =
        mode === "register"
          ? {
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              email: form.email.trim(),
              password: form.password,
              application_ref: application?.ref || null,
              preferred_language: lang,
            }
          : { email: form.email.trim(), password: form.password };
      const res = await apiFetch(mode === "register" ? apiPath.register : apiPath.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const code = await apiErrorCode(res);
        if (code === "email_taken") throw new Error(t("account.errorEmailTaken"));
        if (code === "invalid_credentials") throw new Error(t("account.errorInvalidCredentials"));
        throw new Error(t("common.errorGeneric"));
      }
      const data = await res.json();
      sessionStorage.setItem("cygen_token", data.token);
      navigate(localizedPath(lang, "account"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo pageKey="apply" />
      <TypeBanner eyebrow="CYGEN" title={t("account.registerTitle")} intro={t("account.registerIntro")} ghost={t("common.apply")} testid="banner-register" />
      <Section>
        <div className="mx-auto max-w-md">
          <form onSubmit={submit} className="card space-y-4 bg-surface-2 p-6 sm:p-8" data-testid="register-form">
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rg-first-name" className="field-label">{t("contact.form.firstNameLabel")}</label>
                  <input id="rg-first-name" className="input" data-testid="register-first-name" value={form.firstName} onChange={set("firstName")} required autoComplete="given-name" maxLength={80} />
                </div>
                <div>
                  <label htmlFor="rg-last-name" className="field-label">{t("contact.form.lastNameLabel")}</label>
                  <input id="rg-last-name" className="input" data-testid="register-last-name" value={form.lastName} onChange={set("lastName")} required autoComplete="family-name" maxLength={80} />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="rg-email" className="field-label">{t("account.emailLabel")}</label>
              <input id="rg-email" type="email" className="input" data-testid="register-email" value={form.email} onChange={set("email")} required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="rg-password" className="field-label">{t("account.passwordLabel")}</label>
              <input id="rg-password" type="password" className="input" data-testid="register-password" value={form.password} onChange={set("password")} required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "register" ? "new-password" : "current-password"} />
            </div>
            {mode === "register" && (
              <div>
                <label htmlFor="rg-confirm" className="field-label">{t("account.confirmLabel")}</label>
                <input id="rg-confirm" type="password" className="input" data-testid="register-confirm" value={form.confirm} onChange={set("confirm")} required minLength={8} autoComplete="new-password" />
              </div>
            )}
            {application?.ref && mode === "register" && (
              <p className="rounded-[8px] border border-gold/30 bg-surface px-4 py-3 text-xs text-muted-foreground" data-testid="register-linked">
                {t("account.linkedNote")}
              </p>
            )}
            {error && <p role="alert" className="field-error" data-testid="register-error">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy} data-testid="register-submit">
              {busy ? t("common.sending") : mode === "register" ? t("account.createAccount") : t("account.signIn")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className="w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-gold-text" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }} data-testid="register-toggle">
              {mode === "register" ? t("account.haveAccount") : t("account.needAccount")}
            </button>
            <p className="text-center text-xs text-dim">
              <a href={localizedPath(lang)} className="inline-flex items-center gap-1 transition-colors hover:text-gold-text">
                <UserRound className="h-3 w-3" aria-hidden="true" />
                {t("account.backHome")}
              </a>
            </p>
          </form>
        </div>
      </Section>
    </>
  );
}
