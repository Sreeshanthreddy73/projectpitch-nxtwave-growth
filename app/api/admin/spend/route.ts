import { NextResponse } from "next/server";
import { z } from "zod";
import { adminOnly } from "@/lib/admin-guard";
import { db, unwrap } from "@/lib/db";
import { jsonError, readJson, routeError } from "@/lib/http";
import { cleanParam } from "@/lib/tracking-shared";

const Input = z.object({
  label: z.string().trim().min(2).max(80),
  amount_inr: z.number().int().min(1).max(100000),
  utm_campaign: z.string().trim().max(60).optional(),
  category: z.enum(["acquisition", "prize"]).default("acquisition"),
});

// Record real campaign spend, optionally tied to a utm_campaign so cost per
// registration can be shown for that campaign. Demo spend is seeded, not entered.
export async function POST(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const input = Input.safeParse(await readJson(request));
    if (!input.success) {
      return jsonError(400, "invalid_input", "Enter a label and a whole-rupee amount between 1 and 100000.");
    }
    unwrap(
      await db().from("spend_entries").insert({
        label: input.data.label,
        amount_inr: input.data.amount_inr,
        utm_campaign: cleanParam(input.data.utm_campaign),
        category: input.data.category,
        is_demo: false,
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return routeError(err, "admin");
  }
}

export async function DELETE(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
    if (!id.success) return jsonError(400, "invalid_input", "Invalid spend entry.");
    unwrap(await db().from("spend_entries").delete().eq("id", id.data).eq("is_demo", false));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return routeError(err, "admin");
  }
}
