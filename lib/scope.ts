import type { Interest } from "./options";

// Scope optimizer: turns a student's own idea into a 60-minute MVP.
//
// Rule-based and deterministic. It looks for words that signal a project too
// big for one hour, names the smaller thing to build instead, and lists what
// to leave out and what to keep. Used for the fallback path and to describe
// the scoping for AI-generated projects too.

export type Scope = {
  original: string | null; // the student's idea as typed, if any
  mvp: string; // the 60-minute version's name
  optimized: boolean; // true when the idea was cut down
  remove: string[];
  keep: string[];
};

// Words that make an idea bigger than an hour, and what to leave out for each.
const OVERSCOPE: [RegExp, string][] = [
  [/platform|portal|marketplace|ecosystem|suite|super ?app|erp|system|network/i, "Multi-feature platform"],
  [/login|auth|account|user management|sign ?up|profile/i, "Authentication and accounts"],
  [/database|backend|server|scalab|micro ?service|cloud/i, "Complex database and backend"],
  [/mobile|android|ios|\bapp\b/i, "Mobile app packaging"],
  [/dashboard|analytics|admin panel|report/i, "Dashboards and reporting"],
  [/payment|subscription|billing|e-?commerce/i, "Payments"],
  [/real[- ]?time|live|streaming|iot|hardware|drone|robot/i, "Real-time and hardware integration"],
  [/diagnos|medical|clinical|legal|financial advice|trading/i, "High-stakes decisions (keep it a demo)"],
  [/social|chat app|messag|community/i, "Multi-user features"],
];

const ALWAYS_REMOVE = ["Authentication", "Complex database", "Advanced UI", "Deployment complexity"];
const KEEP = ["One input", "The AI / API call", "The prediction or result", "A simple demo screen"];

// What the 60-minute version is, per area of interest.
const MVP_KIND: Record<Interest, string> = {
  chatbots: "Q&A Bot Demo",
  vision: "Image Detection Demo",
  prediction: "Classification Demo",
  automation: "AI Assistant Demo",
  recsys: "Recommender Demo",
  voice: "Voice Demo",
};

const SCOPE_WORDS = /\b(ai|a\.i\.|ml|based|powered|driven|smart|intelligent|platform|portal|marketplace|ecosystem|suite|system|app|application|website|web ?site|tool|software|solution|project|using|with|for|the|an?|full|complete|end[- ]to[- ]end|advanced|real[- ]?time)\b/gi;

function titleCase(text: string) {
  return text.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function cleanIdea(raw: string | null | undefined): string | null {
  const idea = raw?.replace(/\s+/g, " ").trim();
  return idea && idea.length >= 3 ? idea.slice(0, 120) : null;
}

// Name for the 60-minute version of a typed idea, e.g.
// "AI Medical Diagnosis Platform" + prediction → "Medical Diagnosis Classification Demo".
export function mvpName(idea: string, interest: Interest): string {
  const core = idea
    .replace(SCOPE_WORDS, " ")
    .replace(/[^a-zA-Z0-9 &-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
  return `${titleCase(core || "AI")} ${MVP_KIND[interest]}`;
}

export function scopeFor(original: string | null, mvpTitle: string): Scope {
  if (!original) {
    // No typed idea: the generated project is already scoped. Still show what was deliberately left out.
    return { original: null, mvp: mvpTitle, optimized: false, remove: ALWAYS_REMOVE, keep: KEEP };
  }
  const flagged = OVERSCOPE.filter(([pattern]) => pattern.test(original)).map(([, label]) => label);
  const optimized = flagged.length > 0 || original.split(" ").length > 6;
  // Idea-specific cuts first, then the standard ones, without near-duplicates.
  const remove = [...flagged, ...ALWAYS_REMOVE.filter((item) => !flagged.some((f) => f.toLowerCase().includes(item.split(" ")[0].toLowerCase())))].slice(0, 5);
  return { original, mvp: mvpTitle, optimized, remove, keep: KEEP };
}
