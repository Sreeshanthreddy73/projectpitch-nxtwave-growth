// Text helpers for presenting a blueprint's problem statement.

function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]).map((s) => s.trim());
}

// One-line description (the first sentence) and the rest as the "why".
export function splitProblem(problem: string): { oneLiner: string; why: string } {
  const [first, ...rest] = sentences(problem);
  return { oneLiner: first, why: rest.join(" ") || first };
}

// First two sentences: enough to understand the project on a shared card.
export function shortProblem(problem: string): string {
  return sentences(problem).slice(0, 2).join(" ");
}
