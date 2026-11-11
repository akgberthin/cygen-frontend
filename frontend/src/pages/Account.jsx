import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Seo from "../components/Seo";
import { Section, TypeBanner } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";
import { apiFetch, apiPath } from "../lib/api";
import { localizedPath } from "../lib/links";
import { Concierge } from "./Apply";

export default function Account() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("cygen_token");
    if (!token) {
      navigate(localizedPath(lang, "register"));
      return;
    }
    apiFetch(apiPath.me, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthorized");
        const data = await res.json();
        setUser(data.user);
        setPhone(data.user.phone || "");
      })
      .catch(() => {
        sessionStorage.removeItem("cygen_token");
        navigate(localizedPath(lang, "register"));
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    const token = sessionStorage.getItem("cygen_token");
    await apiFetch(apiPath.me, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone: phone || null, preferred_language: lang }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  function signOut() {
    sessionStorage.removeItem("cygen_token");
    navigate(localizedPath(lang));
  }

  if (checking || !user) {
    return <main className="min-h-screen bg-background" data-testid="account-loading" />;
  }

  const app = user.application;

  return (
    <>
      <Seo pageKey="apply" />
      <TypeBanner eyebrow="CYGEN" title={`${t("account.welcome")}, ${user.name}`} intro={t("account.intro")} ghost={t("account.title")} testid="banner-account" />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-6">
            <div className="card bg-surface-2 p-6 sm:p-8" data-testid="account-summary">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("account.yourApplication")}</h2>
                <button type="button" onClick={signOut} className="btn-outline !px-3 !py-1.5 text-xs" data-testid="account-signout">
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("account.signOut")}
                </button>
              </div>
              {app ? (
                <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  {[
                    [t("account.colPath"), app.path === "purchase" ? t("apply.pathPurchase") : t("apply.pathRefinance")],
                    [t("admin.colCity"), app.city],
                    [t("admin.colValue"), app.home_value],
                    [t("admin.colExisting"), app.existing_financing],
                    [t("admin.colShare"), app.initial_share != null ? `${app.initial_share}%` : null],
                  ].filter(([, v]) => v != null && v !== "").map(([label, v]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-semibold text-cream">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground" data-testid="account-no-application">{t("account.noApplication")}</p>
              )}
            </div>

            <form onSubmit={saveProfile} className="card bg-surface-2 p-6 sm:p-8" data-testid="account-profile">
              <h2 className="text-lg font-semibold">{t("account.completeProfile")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("account.completeProfileText")}</p>
              <div className="mt-4">
                <label htmlFor="acc-phone" className="field-label">{t("account.phoneLabel")}</label>
                <input id="acc-phone" className="input" data-testid="account-phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button type="submit" className="btn-primary" data-testid="account-save">{t("account.save")}</button>
                {saved && <span className="text-sm text-green" data-testid="account-saved">{t("account.saved")}</span>}
              </div>
            </form>
          </div>

          <Concierge path={app?.path || null} step={3} scenario={null} />
        </div>
      </Section>
    </>
  );
}
