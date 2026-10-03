import { NextResponse } from "next/server";
import { adminOnly } from "@/lib/admin-guard";
import { db, unwrap } from "@/lib/db";
import { buildDemoData } from "@/lib/demo-data";
import { routeError } from "@/lib/http";

const TABLES = ["events", "insights", "spend_entries", "registrations"] as const;

// Removes every simulated row. Real rows (is_demo = false) are never touched.
async function clearDemoData() {
  for (const table of TABLES) {
    unwrap(await db().from(table).delete().eq("is_demo", true));
  }
}

async function insertInChunks(table: string, rows: object[], size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    unwrap(await db().from(table).insert(rows.slice(i, i + size)));
  }
}

// Load Demo Data: replaces any existing simulation with a fresh one.
export async function POST() {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    await clearDemoData();
    const data = buildDemoData();
    await insertInChunks("registrations", data.registrations);
    await insertInChunks("events", data.events);
    await insertInChunks("spend_entries", data.spend);
    return NextResponse.json({
      loaded: { registrations: data.registrations.length, events: data.events.length, spend_entries: data.spend.length },
    });
  } catch (err) {
    return routeError(err, "admin");
  }
}

export async function DELETE() {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    await clearDemoData();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return routeError(err, "admin");
  }
}
