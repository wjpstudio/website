import Link from "next/link";
import { projects, statusDots, statusColors } from "@/lib/data";

export default function Home() {
  const activeProjects = projects.filter(
    (p) => p.status === "live" || p.status === "launching"
  );

  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="pt-32 pb-24">
        <p className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
          WJP Studio
        </p>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight leading-[1.1] mb-6 text-balance max-w-2xl">
          One person. Four agents.
          <br />
          Building for the AI economy.
        </h1>
        <p className="text-subtle text-lg max-w-xl leading-relaxed">
          A solo operator running an autonomous AI studio. Shipping products,
          content, and code around the clock.
        </p>
      </section>

      {/* Active Projects */}
      <section className="py-16 border-t border-border/50">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase">
            Active Projects
          </h2>
          <Link
            href="/projects"
            className="text-sm text-muted hover:text-subtle transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="space-y-6">
          {activeProjects.map((project) => (
            <div
              key={project.slug}
              className="group flex items-start justify-between py-4 border-b border-border/30 last:border-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-normal">{project.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${statusDots[project.status]}`}
                    />
                    <span
                      className={`font-mono text-xs ${statusColors[project.status]}`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted max-w-md">
                  {project.description}
                </p>
              </div>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-muted hover:text-subtle transition-colors shrink-0 mt-1"
                >
                  {project.url.replace("https://", "")}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Studio */}
      <section className="py-16 border-t border-border/50">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase">
            The Studio
          </h2>
          <Link
            href="/studio"
            className="text-sm text-muted hover:text-subtle transition-colors"
          >
            Meet the team
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {["Claud", "Kikai", "Yama", "Kodo"].map((name) => (
            <div key={name} className="space-y-2">
              <div className="w-full aspect-square bg-surface rounded-lg border border-border/50 flex items-center justify-center">
                <span className="font-mono text-2xl text-muted/30">
                  {name[0]}
                </span>
              </div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted font-mono">
                {name === "Claud"
                  ? "builder"
                  : name === "Kikai"
                    ? "operator"
                    : name === "Yama"
                      ? "grower"
                      : "builder"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted font-mono">wjp.studio</p>
          <p className="text-xs text-muted">2026</p>
        </div>
      </footer>
    </div>
  );
}
