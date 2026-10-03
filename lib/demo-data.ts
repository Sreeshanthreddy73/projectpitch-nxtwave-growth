import "server-only";
import { BRANCHES } from "./options";

// Simulated campaign for demonstrations: five days into a seven-day campaign.
// Every row is written with is_demo = true and is only ever shown in the
// dashboard's Demo view under a "DEMO DATA — SIMULATION" banner.
//
// People are invented: names are random first-name/initial pairs, colleges are
// fictional, and emails use the reserved example.com domain.
//
// The numbers come from the channel assumptions below plus a seeded random
// generator, so each load produces the same shape of campaign.

const DAYS = 5;
const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;

// [source, medium, campaign, visitors over 5 days, visit→generate, generate→register]
const CHANNELS: [string | null, string | null, string | null, number, number, number][] = [
  ["whatsapp", "group", "cse_group_a", 230, 0.62, 0.52],
  ["whatsapp", "group", "ece_group_b", 165, 0.55, 0.44],
  ["whatsapp", "group", "placement_cell", 145, 0.58, 0.5],
  ["instagram", "paid", "reel_resume_hook", 430, 0.34, 0.22],
  ["instagram", "story", "story_countdown", 130, 0.3, 0.2],
  ["linkedin", "post", "final_year_post", 170, 0.48, 0.38],
  [null, null, null, 100, 0.4, 0.3],
];
const DAY_WEIGHTS = [0.14, 0.18, 0.2, 0.23, 0.25];

// Variant A (resume hook) is simulated to convert better than B (build hook).
const VARIANT_LIFT = { a: 1.15, b: 0.85 };
const SHARE_RATE = 0.3;
const REFERRAL_VISIT_TO_GENERATE = 0.6;
const REFERRAL_GENERATE_TO_REGISTER = 0.42;

const SPEND = [
  { label: "Instagram reel boost", utm_campaign: "reel_resume_hook", amount_inr: 800 },
  { label: "Poster and creative templates", utm_campaign: null, amount_inr: 300 },
  { label: "Top-referrer prize pool (prototype)", utm_campaign: null, amount_inr: 500 },
];

const FIRST_NAMES = [
  "Aarav", "Ananya", "Bhavya", "Charan", "Divya", "Eshwar", "Farhan", "Gayathri", "Harsha", "Ishita",
  "Jahnavi", "Karthik", "Lakshmi", "Manoj", "Nikhil", "Pooja", "Rahul", "Sneha", "Tarun", "Uma",
  "Varun", "Yamini", "Sai", "Meghana", "Rohit", "Keerthi", "Akhil", "Swathi", "Vamsi", "Deepika",
];
const COLLEGES = [
  "Deccan Institute of Technology",
  "Godavari Engineering College",
  "Krishna Valley College of Engineering",
  "Nallamala Institute of Technology",
  "Coastal Institute of Science and Technology",
  "Musi School of Engineering",
  "Satavahana Engineering College",
  "Kakatiya Hills Institute of Technology",
];
const COLLEGE_WEIGHTS = [0.24, 0.19, 0.15, 0.12, 0.1, 0.08, 0.07, 0.05];
const BRANCH_WEIGHTS = [0.34, 0.14, 0.12, 0.2, 0.08, 0.06, 0.04, 0.02];

// mulberry32: small deterministic random generator.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type EventRow = {
  session_id: string;
  type: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ref_code: string | null;
  variant: string;
  is_demo: true;
  created_at: string;
};

type RegistrationRow = {
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  ref_code: string;
  referred_by: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  variant: string;
  consent_at: string;
  is_demo: true;
  created_at: string;
};

export function buildDemoData(now = Date.now()) {
  const rand = seeded(20261003);
  const pick = <T,>(items: readonly T[], weights?: number[]): T => {
    if (!weights) return items[Math.floor(rand() * items.length)];
    let r = rand();
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join("");
  const uuid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;

  const events: EventRow[] = [];
  const registrations: RegistrationRow[] = [];
  // The campaign started at midnight IST four days ago, so today is day 5.
  const todayStart = Math.floor((now + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS;
  const start = todayStart - (DAYS - 1) * DAY_MS;
  const todayFraction = (now - todayStart) / DAY_MS;

  // Runs one visitor through the funnel. A registrant who shares produces
  // referred visitors, who go through the same function one level deeper.
  function visitor(
    at: number,
    channel: { source: string | null; medium: string | null; campaign: string | null },
    generateRate: number,
    registerRate: number,
    referrer: string | null,
    depth: number,
  ) {
    if (at > now) return;
    const variant = rand() < 0.5 ? "a" : "b";
    const base = {
      session_id: uuid(),
      utm_source: channel.source,
      utm_medium: channel.medium,
      utm_campaign: channel.campaign,
      ref_code: referrer,
      variant,
      is_demo: true as const,
    };
    const event = (type: string, time: number) =>
      events.push({ ...base, type, created_at: new Date(Math.min(time, now)).toISOString() });

    if (referrer) event("card_view", at);
    event("visit", at + 20_000);
    if (rand() > generateRate) return;
    event("generate", at + 80_000);
    if (rand() > registerRate * VARIANT_LIFT[variant]) return;

    const registeredAt = at + 170_000;
    if (registeredAt > now) return;
    const n = registrations.length + 1;
    const code = `DEMO${String(n).padStart(4, "0")}`;
    registrations.push({
      name: `${pick(FIRST_NAMES)} ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`,
      email: `demo.student${n}@example.com`,
      college: pick(COLLEGES, COLLEGE_WEIGHTS),
      branch: pick(BRANCHES, BRANCH_WEIGHTS),
      year: rand() < 0.85 ? "Final year" : "3rd year",
      ref_code: code,
      referred_by: referrer,
      utm_source: channel.source,
      utm_medium: channel.medium,
      utm_campaign: channel.campaign,
      variant,
      consent_at: new Date(registeredAt).toISOString(),
      is_demo: true,
      created_at: new Date(registeredAt).toISOString(),
    });
    event("register", registeredAt);

    if (depth >= 3 || rand() > SHARE_RATE) return;
    event("share_click", registeredAt + 60_000);
    const friends = 1 + Math.floor(rand() * 5);
    for (let i = 0; i < friends; i++) {
      const delay = (0.5 + rand() * 20) * 3_600_000;
      visitor(
        registeredAt + delay,
        { source: "referral", medium: null, campaign: null },
        REFERRAL_VISIT_TO_GENERATE,
        REFERRAL_GENERATE_TO_REGISTER,
        code,
        depth + 1,
      );
    }
  }

  for (const [source, medium, campaign, visitors, generateRate, registerRate] of CHANNELS) {
    for (let day = 0; day < DAYS; day++) {
      const isToday = day === DAYS - 1;
      // Today is only partly over, so it gets a proportional share of its traffic.
      const count = Math.round(visitors * DAY_WEIGHTS[day] * (isToday ? Math.min(1, todayFraction * 1.2) : 1));
      for (let i = 0; i < count; i++) {
        // Past days: activity between 07:00 and 23:00. Today: any time up to now.
        const offset = isToday ? rand() * todayFraction : (7 + rand() * 16) / 24;
        visitor(start + (day + offset) * DAY_MS, { source, medium, campaign }, generateRate, registerRate, null, 0);
      }
    }
  }

  // Referrers must be inserted before the people they referred.
  registrations.sort((x, y) => x.created_at.localeCompare(y.created_at));

  const spend = SPEND.map((s, i) => ({
    ...s,
    is_demo: true as const,
    created_at: new Date(start + i * 3_600_000).toISOString(),
  }));

  return { registrations, events, spend };
}
