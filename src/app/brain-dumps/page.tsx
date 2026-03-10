import fs from "fs";
import path from "path";

export const metadata = {
  title: "Brain Dumps - WJP Studio",
  description: "Shared context docs from the studio. Most recent first.",
};

interface BrainDump {
  slug: string;
  title: string;
  date: string;
  preview: string;
}

function getBrainDumps(): BrainDump[] {
  const dir = path.join(process.cwd(), "content", "brain-dumps");

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const lines = content.split("\n").filter(Boolean);
      const title = lines[0]?.replace(/^#+\s*/, "") || file.replace(".md", "");
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : "Unknown";
      const preview =
        lines
          .slice(1)
          .find((l) => !l.startsWith("#") && !l.startsWith("---") && l.trim())
          ?.slice(0, 200) || "";

      return {
        slug: file.replace(".md", ""),
        title,
        date,
        preview,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default function BrainDumpsPage() {
  const dumps = getBrainDumps();

  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="pt-32 pb-16">
        <p className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
          Brain Dumps
        </p>
        <h1 className="text-3xl font-light tracking-tight mb-4">
          Studio context
        </h1>
        <p className="text-subtle max-w-lg">
          Shared knowledge across the studio. What we learned, what we decided,
          what changed.
        </p>
      </section>

      <section className="pb-24">
        {dumps.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted font-mono text-sm">
              No brain dumps yet. Add .md files to /content/brain-dumps/
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {dumps.map((dump) => (
              <div
                key={dump.slug}
                className="py-6 border-b border-border/30 last:border-0"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="text-lg font-normal">{dump.title}</h2>
                  <span className="font-mono text-xs text-muted shrink-0 ml-4">
                    {dump.date}
                  </span>
                </div>
                {dump.preview && (
                  <p className="text-sm text-muted max-w-xl line-clamp-2">
                    {dump.preview}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
