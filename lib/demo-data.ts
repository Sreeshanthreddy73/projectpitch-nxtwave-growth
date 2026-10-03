import "server-only";
import { BUDGET_PLAN } from "./config";
import { BRANCHES } from "./options";

// CAMPAIGN SIMULATION
//
// A simulated run of the full 7-day idea → workshop → showcase campaign that
// ends on the 500-registration target. It shows how the plan COULD reach 500;
// it is not a result. Every row is written with is_demo = true and is only
// shown in the dashboard's Demo view under "DEMO DATA — CAMPAIGN SIMULATION".
//
// People are invented: names are random first-name/initial pairs, colleges are
// fictional, emails use the reserved example.com domain.
//
// The simulation is built from the assumptions below, not sampled until it
// happens to hit a number: registrations per day and per channel are fixed by
// the plan, and the funnel around them is derived from assumed rates.

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;

// Assumed registrations per day. Cumulative: 40, 95, 160, 235, 320, 410, 500.
export const DAILY_REGISTRATIONS = [40, 55, 65, 75, 85, 90, 90];

// Assumed channels: registrations per day, and funnel rates used to derive how
// many visitors and blueprint generations sit behind those registrations.
// There is no paid channel: the whole ₹2,000 budget is prize money, and
// acquisition is organic (communities, clubs and shared project cards).
const CHANNELS = [
  {
    id: "whatsapp",
    source: "whatsapp",
    medium: "community",
    campaign: "student_groups",
    perDay: [21, 23, 23, 24, 29, 27, 28], // 175
    visitToGenerate: 0.6,
    generateToRegister: 0.5,
  },
  {
    id: "clubs",
    source: "clubs",
    medium: "community",
    campaign: "coding_clubs",
    perDay: [11, 14, 15, 16, 15, 15, 14], // 100
    visitToGenerate: 0.62,
    generateToRegister: 0.52,
  },
  {
    id: "organic",
    source: null,
    medium: null,
    campaign: null,
    perDay: [4, 5, 6, 7, 7, 8, 8], // 45
    visitToGenerate: 0.5,
    generateToRegister: 0.4,
  },
  {
    // Students who arrive from a classmate's shared project card or from
    // "Build Yours" on Campus Builders. Grows as more projects exist to share.
    id: "referral",
    source: "referral",
    medium: null,
    campaign: null,
    perDay: [4, 13, 21, 28, 34, 40, 40], // 180
    visitToGenerate: 0.7,
    generateToRegister: 0.55,
  },
] as const;

// Of students who unlock their entry, the share assumed to submit a project.
const SUBMIT_RATE = 0.6;
// Registrants who share their link but whose friend never registers.
const UNSUCCESSFUL_SHARE_RATE = 0.12;
// Share of referrals that go to someone who has already referred a friend.
const REPEAT_REFERRER_RATE = 0.18;
// Simulated A/B split of registrations (B = competition-first). Kept close so
// the demo does not manufacture a winner.
const VARIANT_B_SHARE = 0.52;

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

type Attribution = { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null };

type EventRow = Attribution & {
  session_id: string;
  type: string;
  ref_code: string | null;
  variant: string;
  is_demo: true;
  created_at: string;
};

type RegistrationRow = Attribution & {
  id: string;
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  ref_code: string;
  referred_by: string | null;
  variant: string;
  consent_at: string;
  is_demo: true;
  created_at: string;
};

type SubmissionRow = {
  registration_id: string;
  project_url: string;
  summary: string;
  score: number;
  is_demo: true;
  created_at: string;
  updated_at: string;
};

export function buildDemoData(now = Date.now()) {
  const rand = seeded(20261004);
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
  const iso = (ms: number) => new Date(ms).toISOString();

  // The simulated campaign ran over the seven full days before today (IST).
  const todayStart = Math.floor((now + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS;
  const start = todayStart - DAILY_REGISTRATIONS.length * DAY_MS;
  const end = todayStart - 60_000;
  // A moment on campaign day `day`, between 08:00 and 23:00.
  const moment = (day: number, from = 8, to = 23) => start + day * DAY_MS + (from + rand() * (to - from)) * 3_600_000;

  const events: EventRow[] = [];
  const registrations: (RegistrationRow & { at: number; session: string })[] = [];
  const submissions: SubmissionRow[] = [];
  const referralCount = new Map<string, number>();

  const event = (session: string, type: string, at: number, a: Attribution, variant: string, ref: string | null) =>
    events.push({ session_id: session, type, ...a, ref_code: ref, variant, is_demo: true, created_at: iso(Math.min(at, end)) });

  for (let day = 0; day < DAILY_REGISTRATIONS.length; day++) {
    for (const channel of CHANNELS) {
      const registered = channel.perDay[day];
      const attribution: Attribution = { utm_source: channel.source, utm_medium: channel.medium, utm_campaign: channel.campaign };
      const isReferral = channel.id === "referral";

      // Visitors and generators implied by the assumed funnel rates.
      const generators = Math.round(registered / channel.generateToRegister);
      const visitors = Math.round(generators / channel.visitToGenerate);

      for (let i = 0; i < visitors; i++) {
        const converts = i < registered;
        const generates = i < generators;
        // Referral traffic arrives later in the day, after earlier registrants have shared.
        let at = isReferral ? moment(day, 10, 23) : moment(day);
        const session = uuid();
        const variant = converts ? (rand() < VARIANT_B_SHARE ? "b" : "a") : rand() < 0.5 ? "b" : "a";

        // A referred visitor arrives through an earlier registrant's link.
        let referrer: string | null = null;
        if (isReferral) {
          let earlier = registrations.filter((r) => r.at < at);
          if (earlier.length === 0) {
            // Nobody had registered yet at that moment: arrive just after the first registrant instead.
            earlier = [registrations.reduce((first, r) => (r.at < first.at ? r : first))];
            at = earlier[0].at + 600_000;
          }
          const repeat = earlier.filter((r) => referralCount.has(r.ref_code));
          referrer = (converts && repeat.length > 0 && rand() < REPEAT_REFERRER_RATE ? pick(repeat) : pick(earlier)).ref_code;
          event(session, "card_view", at - 20_000, attribution, variant, referrer);
        }

        event(session, "visit", at, attribution, variant, referrer);
        if (!generates) continue;
        event(session, "generate", at + 60_000, attribution, variant, referrer);
        if (!converts) continue;

        const registeredAt = at + 150_000;
        const n = registrations.length + 1;
        const code = `DEMO${String(n).padStart(4, "0")}`;
        registrations.push({
          id: uuid(),
          name: `${pick(FIRST_NAMES)} ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`,
          email: `demo.student${n}@example.com`,
          college: pick(COLLEGES, COLLEGE_WEIGHTS),
          branch: pick(BRANCHES, BRANCH_WEIGHTS),
          year: rand() < 0.9 ? "Final year" : "3rd year",
          ref_code: code,
          referred_by: referrer,
          ...attribution,
          variant,
          consent_at: iso(registeredAt),
          is_demo: true,
          created_at: iso(registeredAt),
          at: registeredAt,
          session,
        });
        event(session, "register", registeredAt, attribution, variant, referrer);

        // The referral is verified at the moment the friend registers. The
        // referrer's first verified referral unlocks their competition entry.
        if (referrer) {
          const count = (referralCount.get(referrer) ?? 0) + 1;
          referralCount.set(referrer, count);
          event(session, "referral_verified", registeredAt, attribution, variant, referrer);
          if (count === 1) event(session, "competition_unlocked", registeredAt, attribution, variant, referrer);
        }
      }
    }
  }

  // Sharing and submissions, now that every referral is known.
  for (const r of registrations) {
    const attribution: Attribution = { utm_source: r.utm_source, utm_medium: r.utm_medium, utm_campaign: r.utm_campaign };
    const referred = registrations.filter((f) => f.referred_by === r.ref_code);
    const shared = referred.length > 0 || rand() < UNSUCCESSFUL_SHARE_RATE;
    if (shared) {
      const sharedAt = referred.length > 0 ? Math.min(...referred.map((f) => f.at)) - 900_000 : r.at + 120_000;
      event(r.session, "share_click", Math.max(sharedAt, r.at + 60_000), attribution, r.variant, r.referred_by);
    }
    if (referred.length > 0 && rand() < SUBMIT_RATE) {
      const unlockedAt = Math.min(...referred.map((f) => f.at));
      const submittedAt = unlockedAt + (2 + rand() * 30) * 3_600_000;
      if (submittedAt > end) continue; // unlocked too late to submit before the campaign closed
      submissions.push({
        registration_id: r.id,
        project_url: `https://example.com/demo-projects/${r.ref_code.toLowerCase()}`,
        summary: "Simulated competition entry.",
        // simulated preliminary score, spread across a plausible range
        score: Math.round(52 + rand() * 40),
        is_demo: true,
        created_at: iso(submittedAt),
        updated_at: iso(submittedAt),
      });
      event(r.session, "project_submission", submittedAt, attribution, r.variant, r.ref_code);
    }
  }

  // Referrers must be inserted before the people they referred.
  registrations.sort((x, y) => x.at - y.at);

  // The budget plan (all prize money), recorded as simulated spend.
  const spend = BUDGET_PLAN.map((item, i) => ({
    label: `${item.label} (simulated)`,
    utm_campaign: null,
    amount_inr: item.amountInr,
    category: item.category,
    is_demo: true as const,
    created_at: iso(start + i * 3_600_000),
  }));

  return {
    registrations: registrations.map((r) => {
      const row: Partial<typeof r> = { ...r };
      delete row.at;
      delete row.session;
      return row as RegistrationRow;
    }),
    events,
    submissions,
    spend,
  };
}
