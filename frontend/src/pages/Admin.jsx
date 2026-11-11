import React, { useCallback, useEffect, useState } from "react";
import { Download, LogOut, RefreshCw, Send } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { apiPath, apiUrl, resolvePath } from "../lib/api";

const STORAGE_KEY = "cygen-admin-password";

function Table({ columns, rows, emptyText, testid }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground" data-testid={`${testid}-empty`}>{emptyText}</p>;
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border">
      <table className="w-full min-w-[640px] text-left text-sm" data-testid={testid}>
        <thead className="bg-surface-3 text-cream">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="px-4 py-3 font-semibold">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((c) => (
                <td key={c.key} className="max-w-64 truncate px-4 py-3 text-body">{c.render ? c.render(row) : row[c.key] ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({ title, count, action, children, testid }) {
  return (
    <section className="space-y-3" data-testid={testid}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}{count != null ? ` (${count})` : ""}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Admin() {
  const { t } = useI18n();
  const [password, setPassword] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [draft, setDraft] = useState("");
  const [leads, setLeads] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [perDay, setPerDay] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [routeStats, setRouteStats] = useState({ routes: [], prompt_version: "" });
  const [retentionDays, setRetentionDays] = useState(180);
  const [purgeResult, setPurgeResult] = useState("");
  const [filters, setFilters] = useState({ path: "", language: "", from: "", to: "" });
  const [error, setError] = useState("");

  const headers = useCallback(
    () => ({ "X-Admin-Password": password }),
    [password]
  );

  const load = useCallback(
    async (secret) => {
      const pwd = secret ?? password;
      setError("");
      const h = { "X-Admin-Password": pwd };
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      const urls = [
        apiPath.adminLeads, apiPath.adminRegistrations, apiPath.adminApplications,
        apiPath.adminDeliveries, apiPath.adminConciergeStats, apiPath.adminSettings,
      ];
      const [a, b, c, d, e, f, g] = await Promise.all([
        ...urls.map((p) => fetch(apiUrl(p), { headers: h })),
        fetch(apiUrl(apiPath.adminScenarios) + (qs ? `?${qs}` : ""), { headers: h }),
      ]);
      if (a.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY);
        setPassword("");
        throw new Error(t("admin.wrongPassword"));
      }
      for (const r of [a, b, c, d, e, f, g]) {
        if (!r.ok) throw new Error(t("admin.loadError"));
      }
      setLeads((await a.json()).leads || []);
      setRegistrations((await b.json()).registrations || []);
      setApplications((await c.json()).applications || []);
      const dd = await d.json();
      setDeliveries(dd.deliveries || []);
      setWebhookConfigured(dd.webhook_configured);
      setRouteStats(await e.json());
      setRetentionDays((await f.json()).retention_days ?? 180);
      const gs = await g.json();
      setScenarios(gs.scenarios || []);
      setPerDay(gs.per_day || []);
    },
    [password, filters, t]
  );

  useEffect(() => {
    document.title = "Admin — CYGEN";
    if (password) load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlock(e) {
    e.preventDefault();
    try {
      sessionStorage.setItem(STORAGE_KEY, draft);
      setPassword(draft);
      const pwd = draft;
      const res = await fetch(apiUrl(apiPath.adminLeads), { headers: { "X-Admin-Password": pwd } });
      if (res.status === 401) throw new Error(t("admin.wrongPassword"));
      setDraft("");
    } catch (err) {
      sessionStorage.removeItem(STORAGE_KEY);
      setPassword("");
      setError(err.message);
    }
  }

  function signOut() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setLeads([]);
    setRegistrations([]);
    setApplications([]);
    setScenarios([]);
    setDeliveries([]);
  }

  useEffect(() => {
    if (password) load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  async function downloadCsv(kind) {
    const res = await fetch(`${apiUrl(apiPath.adminExport)}?kind=${kind}`, { headers: headers() });
    if (res.status === 401) return signOut();
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${kind}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function resend(id) {
    const res = await fetch(apiUrl(resolvePath(apiPath.adminDeliveryResend, id)), { method: "POST", headers: headers() });
    if (res.status === 409) {
      setError(t("admin.webhookNotConfigured"));
      return;
    }
    if (res.ok) load().catch((e) => setError(e.message));
  }

  async function saveRetention() {
    const res = await fetch(apiUrl(apiPath.adminSettings), {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ retention_days: Number(retentionDays) }),
    });
    if (res.ok) setPurgeResult(t("admin.saved"));
  }

  async function purgeNow() {
    const res = await fetch(apiUrl(apiPath.adminScenariosPurge), { method: "POST", headers: headers() });
    if (res.ok) {
      const body = await res.json();
      setPurgeResult(`${body.deleted} ${t("admin.purged")}`);
      load().catch((e) => setError(e.message));
    }
  }

  if (!password) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" data-testid="admin-login">
        <form onSubmit={unlock} className="card w-full max-w-sm space-y-4 bg-surface-2 p-8">
          <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
          <div>
            <label htmlFor="admin-password" className="field-label">{t("admin.passwordLabel")}</label>
            <input
              id="admin-password"
              data-testid="admin-password-input"
              type="password"
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p role="alert" className="field-error" data-testid="admin-error">{error}</p>}
          <button type="submit" className="btn-primary w-full" data-testid="admin-signin">{t("admin.signIn")}</button>
        </form>
      </main>
    );
  }

  const leadCols = [
    { key: "created_at", label: t("admin.colDate") },
    { key: "name", label: t("admin.colName") },
    { key: "email", label: t("admin.colEmail") },
    { key: "phone", label: t("admin.colPhone") },
    { key: "preferred_language", label: t("admin.colLang") },
    { key: "path_interest", label: t("admin.colPath") },
    { key: "message", label: t("admin.colMessage") },
  ];
  const regCols = [
    { key: "created_at", label: t("admin.colDate") },
    { key: "workshop_id", label: t("admin.colWorkshop") },
    { key: "name", label: t("admin.colName") },
    { key: "email", label: t("admin.colEmail") },
    { key: "phone", label: t("admin.colPhone") },
    { key: "preferred_language", label: t("admin.colLang") },
  ];
  const appCols = [
    { key: "created_at", label: t("admin.colDate") },
    { key: "path", label: t("admin.colPath") },
    { key: "name", label: t("admin.colName") },
    { key: "email", label: t("admin.colEmail") },
    { key: "phone", label: t("admin.colPhone") },
    { key: "city", label: t("admin.colCity") },
    { key: "home_value", label: t("admin.colValue") },
    { key: "existing_financing", label: t("admin.colExisting") },
    { key: "initial_share", label: t("admin.colShare") },
    { key: "scenario_id", label: t("admin.colScenario") },
  ];
  const scenarioCols = [
    { key: "created_at", label: t("admin.colDate") },
    { key: "id", label: "ID" },
    { key: "language", label: t("admin.colLang") },
    { key: "path", label: t("admin.colPath") },
    { key: "page", label: t("admin.colPage") },
    { key: "session", label: t("admin.colSession") },
    { key: "figures", label: t("admin.colFigures"), render: (r) => JSON.stringify(r.figures || {}) },
    { key: "application_id", label: t("admin.colApplication") },
  ];
  const deliveryCols = [
    { key: "created_at", label: t("admin.colDate") },
    { key: "event", label: t("admin.colEvent") },
    { key: "id", label: t("admin.colDelivery") },
    { key: "status", label: t("admin.colStatus") },
    { key: "attempts", label: t("admin.colAttempts") },
    { key: "last_error", label: t("admin.colError") },
    {
      key: "resend",
      label: "",
      render: (r) => (
        <button type="button" className="btn-outline !px-2.5 !py-1 text-xs" onClick={() => resend(r.id)} data-testid={`admin-resend-${r.id}`}>
          <Send className="h-3 w-3" aria-hidden="true" />
          {t("admin.resend")}
        </button>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8" data-testid="admin-dashboard">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          <div className="flex gap-2">
            <button type="button" className="btn-outline !px-3 !py-2" onClick={() => load().catch((e) => setError(e.message))} data-testid="admin-refresh">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("admin.refresh")}
            </button>
            <button type="button" className="btn-outline !px-3 !py-2" onClick={signOut} data-testid="admin-signout">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("admin.signOut")}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="field-error" data-testid="admin-load-error">{error}</p>}

        <SectionCard
          title={t("admin.scenarios")}
          count={scenarios.length}
          testid="admin-scenarios"
          action={
            <button type="button" className="btn-outline !px-3 !py-2" onClick={() => downloadCsv("scenarios")} data-testid="admin-export-scenarios">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("admin.exportCsv")}
            </button>
          }
        >
          <div className="flex flex-wrap items-end gap-3 rounded-[10px] border border-border bg-surface-2 p-4" data-testid="admin-scenario-filters">
            {[
              { key: "path", label: t("admin.colPath"), options: [["", "—"], ["purchase", "purchase"], ["refinance", "refinance"]] },
              { key: "language", label: t("admin.colLang"), options: [["", "—"], ["en", "EN"], ["es", "ES"]] },
            ].map((f) => (
              <label key={f.key} className="text-xs text-muted-foreground">
                {f.label}
                <select
                  className="input mt-1 !w-32 !py-1.5 text-xs"
                  value={filters[f.key]}
                  onChange={(e) => setFilters((s) => ({ ...s, [f.key]: e.target.value }))}
                  data-testid={`admin-filter-${f.key}`}
                >
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            ))}
            <label className="text-xs text-muted-foreground">
              {t("admin.filterFrom")}
              <input type="date" className="input mt-1 !w-36 !py-1.5 text-xs" value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} data-testid="admin-filter-from" />
            </label>
            <label className="text-xs text-muted-foreground">
              {t("admin.filterTo")}
              <input type="date" className="input mt-1 !w-36 !py-1.5 text-xs" value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} data-testid="admin-filter-to" />
            </label>
            <button type="button" className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => load().catch((e) => setError(e.message))} data-testid="admin-filter-apply">
              {t("admin.filterApply")}
            </button>
          </div>
          {perDay.length > 0 && (
            <p className="text-xs text-dim" data-testid="admin-scenario-counts">
              {t("admin.perDay")}: {perDay.slice(0, 7).map((d) => `${d.date} · ${d.count}`).join("  |  ")}
            </p>
          )}
          <Table columns={scenarioCols} rows={scenarios} emptyText={t("admin.empty")} testid="admin-scenarios-table" />
        </SectionCard>

        <SectionCard title={t("admin.deliveries")} count={deliveries.length} testid="admin-deliveries">
          <p className={`text-xs ${webhookConfigured ? "text-green" : "text-dim"}`} data-testid="admin-webhook-status">
            {webhookConfigured ? t("admin.webhookConfigured") : t("admin.webhookNotConfigured")}
          </p>
          <Table columns={deliveryCols} rows={deliveries} emptyText={t("admin.empty")} testid="admin-deliveries-table" />
        </SectionCard>

        <SectionCard title={t("admin.conciergeStats")} testid="admin-concierge-stats">
          <p className="text-xs text-dim">{t("admin.promptVersion")}: {routeStats.prompt_version || "—"}</p>
          {routeStats.routes.length ? (
            <ul className="flex flex-wrap gap-2" data-testid="admin-route-counts">
              {routeStats.routes.map((r) => (
                <li key={r.route} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-body">
                  {r.route} · <strong className="text-gold-text">{r.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
          )}
        </SectionCard>

        <SectionCard title={t("admin.retention")} testid="admin-retention">
          <div className="flex flex-wrap items-end gap-3 rounded-[10px] border border-border bg-surface-2 p-4">
            <label className="text-xs text-muted-foreground">
              {t("admin.retentionDays")}
              <input type="number" min={1} max={3650} className="input mt-1 !w-28 !py-1.5 text-xs" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} data-testid="admin-retention-input" />
            </label>
            <button type="button" className="btn-primary !px-3 !py-1.5 text-xs" onClick={saveRetention} data-testid="admin-retention-save">{t("admin.save")}</button>
            <button type="button" className="btn-outline !px-3 !py-1.5 text-xs" onClick={purgeNow} data-testid="admin-purge">{t("admin.purgeNow")}</button>
            {purgeResult && <span className="text-xs text-green" data-testid="admin-purge-result">{purgeResult}</span>}
          </div>
        </SectionCard>

        <SectionCard
          title={t("admin.applications")}
          count={applications.length}
          testid="admin-applications"
          action={
            <button type="button" className="btn-outline !px-3 !py-2" onClick={() => downloadCsv("applications")} data-testid="admin-export-applications">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("admin.exportCsv")}
            </button>
          }
        >
          <Table columns={appCols} rows={applications} emptyText={t("admin.empty")} testid="admin-applications-table" />
        </SectionCard>

        <SectionCard
          title={t("admin.leads")}
          count={leads.length}
          testid="admin-leads"
          action={
            <button type="button" className="btn-outline !px-3 !py-2" onClick={() => downloadCsv("leads")} data-testid="admin-export-leads">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("admin.exportCsv")}
            </button>
          }
        >
          <Table columns={leadCols} rows={leads} emptyText={t("admin.empty")} testid="admin-leads-table" />
        </SectionCard>

        <SectionCard
          title={t("admin.registrations")}
          count={registrations.length}
          testid="admin-registrations"
          action={
            <button type="button" className="btn-outline !px-3 !py-2" onClick={() => downloadCsv("registrations")} data-testid="admin-export-registrations">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("admin.exportCsv")}
            </button>
          }
        >
          <Table columns={regCols} rows={registrations} emptyText={t("admin.empty")} testid="admin-registrations-table" />
        </SectionCard>
      </div>
    </main>
  );
}
