import { agents, roleColors } from "@/lib/data";

export const metadata = {
  title: "Studio - WJP Studio",
  description: "The team. One operator, four agents.",
};

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="pt-32 pb-16">
        <p className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
          Studio
        </p>
        <h1 className="text-3xl font-light tracking-tight mb-4">The team</h1>
        <p className="text-subtle max-w-lg">
          WJP is the principal. Four AI agents operate autonomously across
          building, growth, quality, and coordination.
        </p>
      </section>

      {/* Authority chain */}
      <section className="pb-12">
        <div className="font-mono text-sm text-muted border border-border/50 rounded-lg p-6 bg-surface">
          <p className="text-subtle mb-3 text-xs uppercase tracking-widest">
            Authority chain
          </p>
          <p>
            <span className="text-foreground">WJP</span>
            <span className="text-muted mx-2">{"->"}</span>
            <span className="text-violet-400">Kikai</span>
            <span className="text-muted mx-2">{"->"}</span>
            <span className="text-emerald-400">Yama</span>
            <span className="text-muted mx-1">+</span>
            <span className="text-blue-400">Kodo</span>
            <span className="text-muted mx-1">+</span>
            <span className="text-blue-400">Claud</span>
          </p>
        </div>
      </section>

      {/* Agents */}
      <section className="pb-24">
        <div className="space-y-0">
          {agents.map((agent) => (
            <div
              key={agent.handle}
              className="py-8 border-b border-border/30 last:border-0"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-surface border border-border/50 flex items-center justify-center">
                    <span className="font-mono text-sm text-muted">
                      {agent.name[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-normal">{agent.name}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs ${roleColors[agent.role] || "text-muted"}`}
                  >
                    {agent.title}
                  </span>
                  <span className="font-mono text-xs text-muted px-2 py-0.5 border border-border/50 rounded">
                    {agent.model}
                  </span>
                </div>
              </div>
              <p className="text-subtle mb-4 max-w-xl ml-11">
                {agent.description}
              </p>
              <div className="flex flex-wrap gap-2 ml-11">
                {agent.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-mono text-muted px-2 py-0.5 border border-border/50 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="pb-24 border-t border-border/50 pt-16">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase mb-10">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted">01</p>
            <h3 className="text-sm font-medium">Three-Gate Review</h3>
            <p className="text-sm text-muted leading-relaxed">
              Every piece of work goes through agent self-review, Kikai review,
              then WJP approval. Content from Yama ships autonomously.
            </p>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted">02</p>
            <h3 className="text-sm font-medium">Model Routing</h3>
            <p className="text-sm text-muted leading-relaxed">
              Haiku handles monitoring. Sonnet handles content and analysis. Opus
              handles strategy and complex reasoning. Never waste compute.
            </p>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted">03</p>
            <h3 className="text-sm font-medium">24/7 Operation</h3>
            <p className="text-sm text-muted leading-relaxed">
              All agents run heartbeat crons every 20 minutes. Backup to GitHub
              every 2 hours. The studio never sleeps.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
