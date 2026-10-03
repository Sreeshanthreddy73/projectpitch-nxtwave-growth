import { SparkIcon } from "../ui";

// The hero's product preview: an example of what the generator produces.
// It is a static illustration, labelled as an example, not a live result.

const ROADMAP = ["Collect the data", "Build the AI layer", "Connect the interface", "Deploy the prototype"];
const STACK = ["Python", "AI", "RAG", "Streamlit"];

export function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* soft glow in the AI accent, behind the card */}
      <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-ai/15 blur-3xl" />
      <div aria-hidden className="absolute -right-3 -top-3 hidden h-full w-full rounded-3xl border border-line bg-card sm:block" />

      <figure className="relative animate-rise rounded-3xl bg-ink p-6 text-white shadow-lift sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow text-white/55">ProjectPitch project idea</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ai/25 px-2.5 py-1 text-[11px] font-medium text-[#cfc6ff]">
            <SparkIcon className="size-3" /> 60-minute ready
          </span>
        </div>

        <h2 className="mt-5 font-display text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[32px]">
          Smart Campus Assistant
        </h2>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.06] p-3.5">
            <dt className="eyebrow text-white/50">Build readiness</dt>
            <dd className="mt-1 font-display text-xl font-semibold">88 / 100</dd>
          </div>
          <div className="rounded-2xl bg-white/[0.06] p-3.5">
            <dt className="eyebrow text-white/50">Difficulty</dt>
            <dd className="mt-1 font-display text-xl font-semibold">Beginner</dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="eyebrow text-white/50">Stack</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {STACK.map((tool) => (
              <li key={tool} className="rounded-lg border border-white/15 px-2.5 py-1 font-mono text-xs text-white/85">
                {tool}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="eyebrow text-white/50">60-minute build blueprint</p>
          <ol className="mt-3 space-y-2.5">
            {ROADMAP.map((step, i) => (
              <li
                key={step}
                className="flex animate-rise items-center gap-3 text-[15px]"
                style={{ animationDelay: `${200 + i * 110}ms` }}
              >
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <span className="text-white/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <figcaption className="mt-6 text-xs text-white/45">Example. Yours is matched to your interests and built at the workshop.</figcaption>
      </figure>
    </div>
  );
}
