// The content behind the prototype referral rewards. Rendered on the hub only
// after the server has confirmed the referral count, so it cannot be read by
// viewing the page source early.

export const STARTER_PROMPTS = [
  {
    use: "Scope the project",
    prompt:
      "I have 60 minutes and know [your skills]. I want to build [project]. List the smallest version that still works end to end, and what to leave out.",
  },
  {
    use: "Plan the build",
    prompt: "Break [project] into steps of at most 15 minutes. For each step, tell me how I will know it worked.",
  },
  {
    use: "Understand an error",
    prompt:
      "Here is my code and the full error message: [paste]. Explain what the error means in one sentence, then show the smallest fix.",
  },
  {
    use: "Improve a prompt",
    prompt:
      "This prompt gives vague answers: [paste]. Rewrite it so the output is specific, and tell me which words you changed and why.",
  },
  {
    use: "Test it properly",
    prompt: "Give me 10 test inputs for [project], including 3 that should fail or be refused, and the expected result for each.",
  },
  {
    use: "Write the README",
    prompt:
      "Write a README for [project] with: what it does in two lines, how to run it, one screenshot placeholder, and known limitations.",
  },
  {
    use: "Write the resume line",
    prompt:
      "Turn this into one resume bullet that starts with a verb and includes one number I actually measured: [what you built and measured].",
  },
  {
    use: "Prepare for the interview",
    prompt:
      "Act as an interviewer. Ask me 5 questions about [project], one at a time, including one on what I would do differently. Give feedback after each answer.",
  },
];

export const ADVANCED_PROJECTS = [
  {
    title: "Evaluation harness for your first project",
    brief:
      "Take the project you built and add a test set of 30 inputs with expected outputs. Write a script that runs all 30 and prints a score. Change one thing (the prompt or the model) and show the score before and after.",
    proves: "You can measure whether an AI system works, not only build one.",
  },
  {
    title: "Add retrieval to cut cost and errors",
    brief:
      "Replace any step that pastes a whole document into the prompt with retrieval: chunk, embed, fetch the top matches. Report the change in tokens used per request and in answer accuracy on your test set.",
    proves: "You understand the cost and quality trade-offs of LLM applications.",
  },
  {
    title: "Ship it with monitoring",
    brief:
      "Deploy the project on a free tier, log every request with latency and outcome, and build a one-page dashboard with daily usage and error rate. Share the link with five users and fix the top issue they hit.",
    proves: "You can run software for real users and respond to what the data shows.",
  },
];
