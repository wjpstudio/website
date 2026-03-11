interface AgentRowProps {
  name: string;
  role: string;
  active?: boolean;
}

export function AgentRow({ name, role, active = true }: AgentRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        {/* Pixel blinking cursor instead of dot */}
        <span
          className={`inline-block w-[6px] h-[10px] pixel-render ${
            active ? "bg-accent cursor-blink" : "bg-muted/30"
          }`}
        />
        <span className="font-mono text-sm text-foreground glitch-text">
          {name}
        </span>
      </div>
      <span className="font-mono text-xs text-muted tracking-wide uppercase">
        {role}
      </span>
    </div>
  );
}
