import { Project } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="border border-border p-6 bg-surface group glitch-hover">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-mono text-sm tracking-wide text-foreground glitch-text">
          {project.name}
        </h3>
        <StatusBadge status={project.status} />
      </div>
      <p className="text-sm text-muted leading-relaxed mb-4">
        {project.description}
      </p>
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-muted hover:text-accent transition-colors"
        >
          {project.url.replace("https://", "")} ↗
        </a>
      )}
    </div>
  );
}
