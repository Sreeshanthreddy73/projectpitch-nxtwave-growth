import { NextResponse } from "next/server";
import { adminOnly, datasetIsDemo } from "@/lib/admin-guard";
import { generateInsights } from "@/lib/ai";
import { db, unwrap } from "@/lib/db";
import { jsonError, readJson, routeError } from "@/lib/http";
import { getMetrics, toSnapshot } from "@/lib/metrics";
import type { InsightAction } from "@/lib/types";

// Generate Insights: SQL computes the metrics, an aggregate-only snapshot goes
// to the AI (or the rule-based fallback), and the result is saved as a
// recommendation. Nothing in the campaign is changed.
export async function POST(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const body = (await readJson(request)) as { dataset?: unknown } | null;
    const isDemo = datasetIsDemo(body?.dataset);
    if (isDemo === null) return jsonError(400, "invalid_dataset", "dataset must be 'real' or 'demo'.");

    const snapshot = toSnapshot(await getMetrics(isDemo));
    const { insight, generatedBy } = await generateInsights(snapshot);
    const next_actions: InsightAction[] = insight.next_actions.map((a) => ({ ...a, decision: "pending", note: "" }));

    const row = unwrap(
      await db()
        .from("insights")
        .insert({
          metrics_snapshot: snapshot,
          working: insight.working,
          leaking: insight.leaking,
          next_actions,
          generated_by: generatedBy,
          is_demo: isDemo,
        })
        .select("id, working, leaking, next_actions, generated_by, is_demo, created_at")
        .single(),
    );
    return NextResponse.json({ insight: row });
  } catch (err) {
    return routeError(err, "admin");
  }
}
