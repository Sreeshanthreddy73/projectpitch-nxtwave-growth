import { NextResponse } from "next/server";
import { z } from "zod";
import { adminOnly } from "@/lib/admin-guard";
import { db, unwrap } from "@/lib/db";
import { jsonError, readJson, routeError } from "@/lib/http";
import type { InsightAction } from "@/lib/types";

const Input = z.object({
  index: z.number().int().min(0).max(9),
  decision: z.enum(["pending", "accepted", "rejected"]),
  note: z.string().trim().max(300),
});

// Records the campaign owner's decision on one recommended action.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const id = z.uuid().safeParse((await params).id);
    const input = Input.safeParse(await readJson(request));
    if (!id.success || !input.success) return jsonError(400, "invalid_input", "Invalid decision.");

    const row = unwrap(await db().from("insights").select("next_actions").eq("id", id.data).maybeSingle());
    const actions = row?.next_actions as InsightAction[] | undefined;
    if (!actions?.[input.data.index]) return jsonError(404, "not_found", "That recommendation no longer exists.");

    actions[input.data.index] = { ...actions[input.data.index], decision: input.data.decision, note: input.data.note };
    unwrap(await db().from("insights").update({ next_actions: actions }).eq("id", id.data));
    return NextResponse.json({ next_actions: actions });
  } catch (err) {
    return routeError(err, "admin");
  }
}
