import type { Branch, Interest, SkillLevel, Year } from "./options";

export type BlueprintInput = {
  branch: Branch;
  year: Year;
  skill_level: SkillLevel;
  interest: Interest;
};

export type PlanStep = { minutes: number; step: string };
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Blueprint = {
  title: string;
  problem: string;
  stack: string[];
  difficulty: Difficulty;
  build_plan: PlanStep[];
  resume_bullet: string;
};

// What the browser is allowed to see before registration.
export type BlueprintPreview = Pick<Blueprint, "title" | "problem" | "stack" | "difficulty"> & {
  id: string;
  locked_steps: number;
};

export type GeneratedBy = "ai" | "fallback";

export type Decision = "pending" | "accepted" | "rejected";

export type InsightContent = {
  working: { headline: string; detail: string };
  leaking: { headline: string; detail: string };
  next_actions: { action: string; why: string; metric: string }[];
};

export type InsightAction = InsightContent["next_actions"][number] & {
  decision: Decision;
  note: string;
};

export type InsightRow = {
  id: string;
  working: InsightContent["working"];
  leaking: InsightContent["leaking"];
  next_actions: InsightAction[];
  generated_by: GeneratedBy;
  is_demo: boolean;
  created_at: string;
};
