import { ProjectStatus } from "@/lib/data";

const labels: Record<ProjectStatus, string> = {
  live: "LIVE",
  launching: "LAUNCHING",
  building: "BUILDING",
  planning: "RESEARCH",
  paused: "PAUSED",
};

const colors: Record<ProjectStatus, string> = {
  live: "border-accent text-accent",
  launching: "border-foreground/40 text-foreground/60",
  building: "border-foreground/20 text-foreground/40",
  planning: "border-foreground/10 text-foreground/30",
  paused: "border-foreground/10 text-foreground/20",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest px-2 py-0.5 border ${colors[status]}`}
    >
      {/* Pixel cursor indicator instead of dot */}
      <span
        className={`inline-block w-[6px] h-[10px] pixel-render ${
          status === "live" ? "bg-accent cursor-blink" : "bg-current opacity-40"
        }`}
      />
      {labels[status]}
    </span>
  );
}
