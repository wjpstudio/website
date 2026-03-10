import { projects, statusDots, statusColors } from "@/lib/data";

export const metadata = {
  title: "Projects - WJP Studio",
  description: "Active projects and their current status.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="pt-32 pb-16">
        <p className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
          Projects
        </p>
        <h1 className="text-3xl font-light tracking-tight mb-4">
          What we are building
        </h1>
        <p className="text-subtle max-w-lg">
          Products, protocols, and experiments across crypto, commerce, and
          culture.
        </p>
      </section>

      <section className="pb-24">
        <div className="space-y-0">
          {projects.map((project) => (
            <div
              key={project.slug}
              className="py-8 border-b border-border/30 last:border-0"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-normal">{project.name}</h2>
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
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-muted hover:text-subtle transition-colors"
                  >
                    {project.url.replace("https://", "")}
                  </a>
                )}
              </div>
              <p className="text-subtle mb-4 max-w-xl">
                {project.description}
              </p>
              {project.stack && (
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-mono text-muted px-2 py-0.5 border border-border/50 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
