"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CAMPAIGN, SITE_NAME } from "@/lib/config";
import { num } from "@/lib/format";
import type { Metrics } from "@/lib/metrics";
import type { InsightRow } from "@/lib/types";
import { Badge, Button, Card, Spinner, cx } from "../ui";
import { CumulativeChart, DailyChart } from "./daily-chart";
import { Headline } from "./headline";
import { InsightsPanel } from "./insights-panel";
import {
  AbPanel,
  Assumptions,
  BudgetPanel,
  CampaignTable,
  Distribution,
  Funnel,
  Panel,
  SourceTable,
  SpendPanel,
  TopReferrers,
} from "./panels";

type Dataset = "real" | "demo";
type Payload = { metrics: Metrics; insights: InsightRow[]; status: { demoLoaded: boolean; aiConfigured: boolean } };
type LoadError = { message: string; steps?: string[] };
type State = { phase: "loading" } | { phase: "error"; error: LoadError } | { phase: "ready"; data: Payload };

const REFRESH_MS = 15_000;

export function Dashboard() {
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset>("real");
  const [state, setState] = useState<State>({ phase: "loading" });
  const [busy, setBusy] = useState<"load" | "clear" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped when demo data is loaded or cleared, so panels holding their own
  // state (insights) start again from what the server now has.
  const [epoch, setEpoch] = useState(0);

  // quiet = background refresh: keep showing the current numbers if it fails.
  const load = useCallback(
    async (target: Dataset, quiet = false) => {
      try {
        const response = await fetch(`/api/admin/metrics?dataset=${target}`, { cache: "no-store" });
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await response.json().catch(() => null);
        if (response.ok && data) setState({ phase: "ready", data });
        else if (!quiet) setState({ phase: "error", error: data?.message ? data : { message: "Could not load the dashboard." } });
      } catch {
        if (!quiet) setState({ phase: "error", error: { message: "Could not reach the server. Check your connection." } });
      }
    },
    [router],
  );

  useEffect(() => {
    const first = setTimeout(() => load(dataset), 0);
    const timer = setInterval(() => !document.hidden && load(dataset, true), REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [dataset, load]);

  function switchTo(target: Dataset) {
    if (target === dataset) return;
    setNotice(null);
    setState({ phase: "loading" });
    setDataset(target);
  }

  async function demoData(action: "load" | "clear") {
    setNotice(null);
    setBusy(action);
    try {
      const response = await fetch("/api/admin/demo-data", { method: action === "load" ? "POST" : "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice(data?.message ?? "The demo data request failed.");
      } else if (action === "load") {
        setNotice(
          `Loaded the campaign simulation: ${num(data.loaded.registrations)} simulated registrations, ${num(data.loaded.submissions)} simulated submissions.`,
        );
        if (dataset === "demo") await load("demo");
        else switchTo("demo");
      } else {
        setNotice("Demo data cleared. Real data was not touched.");
        await load(dataset);
      }
    } catch {
      setNotice("Could not reach the server.");
    }
    setEpoch((n) => n + 1);
    setBusy(null);
  }

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  const isDemo = dataset === "demo";
  const ready = state.phase === "ready" ? state.data : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div>
          <p className="eyebrow text-muted">{SITE_NAME} · Growth dashboard</p>
          <h1 className="text-h2">{CAMPAIGN.workshopTitle}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Dataset" className="inline-flex rounded-xl border border-line bg-card p-1">
            {(["real", "demo"] as const).map((option) => (
              <button
                key={option}
                onClick={() => switchTo(option)}
                aria-pressed={dataset === option}
                className={cx(
                  "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  dataset === option ? "bg-ink text-white" : "text-muted hover:text-ink",
                )}
              >
                {option === "real" ? "Real data" : "Demo data"}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Dataset status: always visible, so simulated numbers can never be mistaken for real ones. */}
      {isDemo ? (
        <div className="rounded-2xl border-2 border-warn/40 bg-warn-soft p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-wide text-warn">DEMO DATA — CAMPAIGN SIMULATION</p>
              <p className="mt-1 max-w-3xl text-sm text-ink">
                A simulated run of the 7-day campaign, built from the plan&apos;s assumptions to show how it could reach{" "}
                {CAMPAIGN.targetRegistrations} registrations. Invented students, fictional colleges. None of these are
                real registrations or real results.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="dark" loading={busy === "load"} disabled={busy !== null} onClick={() => demoData("load")}>
                {ready?.status.demoLoaded ? "Reload Demo Data" : "Load Demo Data"}
              </Button>
              {ready?.status.demoLoaded && (
                <Button variant="secondary" loading={busy === "clear"} disabled={busy !== null} onClick={() => demoData("clear")}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="good">REAL DATA</Badge>
            <span className="text-body">Only actual visits and registrations recorded by this app.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>Demo data: {ready ? (ready.status.demoLoaded ? "loaded (kept separate)" : "not loaded") : "…"}</span>
            <Button variant="secondary" loading={busy === "load"} disabled={busy !== null} onClick={() => demoData("load")}>
              Load Demo Data
            </Button>
          </div>
        </Card>
      )}

      {notice && (
        <p role="status" className="mt-3 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-ink">
          {notice}
        </p>
      )}

      <div className="mt-6">
        {state.phase === "loading" && (
          <div className="flex items-center gap-3 py-24 text-muted" aria-live="polite">
            <span className="mx-auto flex items-center gap-3">
              <Spinner /> Loading {isDemo ? "demo" : "real"} data…
            </span>
          </div>
        )}

        {state.phase === "error" && (
          <Card className="p-6">
            <p role="alert" className="font-semibold text-ink">
              {state.error.message}
            </p>
            {state.error.steps && (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-body">
                {state.error.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            <Button variant="secondary" className="mt-4" onClick={() => (setState({ phase: "loading" }), load(dataset))}>
              Try again
            </Button>
          </Card>
        )}

        {ready && ready.metrics.dataset === dataset && (
          <DashboardBody key={`${dataset}-${epoch}`} data={ready} reload={() => load(dataset, true)} />
        )}
      </div>
    </div>
  );
}

function DashboardBody({ data, reload }: { data: Payload; reload: () => void }) {
  const { metrics: m, insights, status } = data;
  const isDemo = m.dataset === "demo";
  const empty = m.totals.visitors === 0 && m.totals.registrations === 0;

  if (empty) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <h2 className="text-h3">{isDemo ? "No demo data loaded" : "No real activity yet"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-body">
            {isDemo
              ? "Click Load Demo Data above to fill this view with the 7-day campaign simulation."
              : "Numbers appear here as soon as someone visits the landing page. Try opening it with a tracked link:"}
          </p>
          {!isDemo && (
            <p className="mx-auto mt-3 w-fit rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink">
              /?utm_source=whatsapp&utm_campaign=cse_group_a
            </p>
          )}
        </Card>
        <InsightsPanel dataset={m.dataset} initial={insights} aiConfigured={status.aiConfigured} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Headline m={m} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Cumulative registrations"
          hint={
            isDemo
              ? "SIMULATED trajectory against the straight-line path to the target."
              : "Running total against the straight-line path to the target."
          }
        >
          <CumulativeChart daily={m.daily} />
        </Panel>
        <Funnel m={m} />
      </div>

      <InsightsPanel
        dataset={m.dataset}
        initial={insights}
        aiConfigured={status.aiConfigured}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SourceTable m={m} />
        <AbPanel m={m} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Registrations per day" hint="Dates are in India time. Day 1 is the first day with tracked activity.">
          <DailyChart daily={m.daily} />
        </Panel>
        <BudgetPanel m={m} />
      </div>

      <CampaignTable m={m} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <TopReferrers m={m} />
        <Distribution m={m} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Assumptions m={m} />
        <SpendPanel m={m} onChange={reload} />
      </div>

      <p className="text-xs text-muted">
        Blueprints in this dataset: {num(m.totals.blueprints_ai)} generated by AI, {num(m.totals.blueprints_fallback)} from
        the deterministic fallback. AI status: {status.aiConfigured ? "API key configured" : "no API key, fallback in use"}.
        Refreshes every {REFRESH_MS / 1000} seconds.
      </p>
    </div>
  );
}
