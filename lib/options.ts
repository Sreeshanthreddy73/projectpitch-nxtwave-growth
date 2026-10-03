// The choices offered in the generator form. Shared by client and server so
// the API validates against exactly what the UI shows.

export const BRANCHES = ["CSE", "IT", "AI & DS", "ECE", "EEE", "Mechanical", "Civil", "Other"] as const;
export const YEARS = ["Final year", "3rd year", "2nd year", "1st year"] as const;

export const SKILL_LEVELS = [
  { id: "beginner", label: "Beginner", hint: "Basic Python, or none yet" },
  { id: "intermediate", label: "Intermediate", hint: "Built a small project" },
  { id: "advanced", label: "Advanced", hint: "Used ML libraries or APIs" },
] as const;

export const INTERESTS = [
  { id: "chatbots", label: "Chatbots & assistants" },
  { id: "vision", label: "Computer vision" },
  { id: "prediction", label: "Data & prediction" },
  { id: "automation", label: "Automation & AI agents" },
  { id: "recsys", label: "Search & recommendations" },
  { id: "voice", label: "Voice & audio" },
] as const;

export type Branch = (typeof BRANCHES)[number];
export type Year = (typeof YEARS)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number]["id"];
export type Interest = (typeof INTERESTS)[number]["id"];

export const SKILL_IDS = SKILL_LEVELS.map((s) => s.id) as [SkillLevel, ...SkillLevel[]];
export const INTEREST_IDS = INTERESTS.map((i) => i.id) as [Interest, ...Interest[]];
