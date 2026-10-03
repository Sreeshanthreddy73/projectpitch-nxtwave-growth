import { NextResponse } from "next/server";
import { adminOnly, datasetIsDemo } from "@/lib/admin-guard";
import { aiConfigured } from "@/lib/ai";
import { db, unwrap } from "@/lib/db";
import { jsonError, routeError } from "@/lib/http";
import { getMetrics } from "@/lib/metrics";

// Everything the dashboard shows for one dataset. ?dataset=real|demo is
// required: there is no combined view.
export async function GET(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const isDemo = datasetIsDemo(new URL(request.url).searchParams.get("dataset"));
    if (isDemo === null) return jsonError(400, "invalid_dataset", "dataset must be 'real' or 'demo'.");

    const [metrics, insights, demoProbe] = await Promise.all([
      getMetrics(isDemo),
      db()
        .from("insights")
        .select("id, working, leaking, next_actions, generated_by, is_demo, created_at")
        .eq("is_demo", isDemo)
        .order("created_at", { ascending: false })
        .limit(5),
      db().from("events").select("id").eq("is_demo", true).limit(1),
    ]);

    return NextResponse.json({
      metrics,
      insights: unwrap(insights),
      status: { demoLoaded: (unwrap(demoProbe)?.length ?? 0) > 0, aiConfigured: aiConfigured() },
    });
  } catch (err) {
    return routeError(err, "admin");
  }
}
