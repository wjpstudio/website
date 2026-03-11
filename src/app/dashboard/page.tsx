"use client";

import { useState, useEffect, useCallback } from "react";
import { PixelDivider } from "@/components/PixelDivider";

const BASE_RPC = "https://mainnet.base.org";
const SOL_RPC = "https://solana-rpc.publicnode.com";
const TREASURY_BASE = "0x51e0c3cb17e8AAb6391F40468A34E8E94aa1166E";
const TREASURY_SOL = "DPe3WqzeJisHPj4LyjRNcVgtUYUzJmmC4LkvUifadaLm";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const COINGECKO =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd";

const AGENTS = [
  { key: "claud", name: "Claud", role: "Builder", pfp: "/pfp/claud.png" },
  { key: "kikai", name: "Kikai", role: "Operator", pfp: "/pfp/kikai.png" },
  { key: "yama", name: "Yama", role: "Grower", pfp: "/pfp/yama.png" },
  { key: "kodo", name: "Kodo", role: "Builder", pfp: "/pfp/kodo.png" },
];

interface AgentData {
  status: string;
  workingOn: string;
  contextPct: number | null;
  model: string;
  sessionDurationMin: number | null;
  lastActivityMin: number | null;
  rateLimit: boolean;
}

interface UsageAgent {
  allModels: number | null;
  sonnet: number | null;
  opus: number | null;
}

interface NeedsWjpItem {
  priority: string;
  title: string;
  ask: string;
}

interface Treasury {
  eth: string;
  ethUsd: string;
  usdcBase: string;
  sol: string;
  solUsd: string;
  total: string;
}

interface BrainDump {
  id: string;
  date: string;
  title: string;
  source: "wjp+claud" | "studio";
  summary: string;
  keyDecisions: string[];
  pending: string[];
}

// ── Blinking Cursor ──────────────────────────────────
function Cursor({ active = true }: { active?: boolean }) {
  return (
    <span
      className={`inline-block w-[6px] h-[10px] pixel-render ${
        active ? "bg-accent cursor-blink" : "bg-muted/20"
      }`}
    />
  );
}

// ── Usage Bar ────────────────────────────────────────
function UsageBar({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null) return null;
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-accent";
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[12px] text-muted w-14 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-[2px] bg-border pixel-render">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[12px] text-muted w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────
export default function DashboardPage() {
  const [agents, setAgents] = useState<Record<string, AgentData>>({});
  const [usage, setUsage] = useState<Record<string, UsageAgent>>({});
  const [usageResets, setUsageResets] = useState("");
  const [kodoData, setKodoData] = useState<{
    activeTask: string | { name: string; status: string; progress_percent?: number; blockedOn?: string | null };
    recentOutputs: { file?: string; filename?: string; lines?: number; size?: number; summary?: string }[];
    cronJobs: { name: string; schedule: string; status: string }[];
  } | null>(null);
  const [needsWjp, setNeedsWjp] = useState<NeedsWjpItem[]>([]);
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [products, setProducts] = useState<{
    bundles: { id: string; name: string; price: number; includes: string[]; tagline: string; status: string; addedBy: string }[];
    pipeline: { id: string; name: string; description: string; status: string; owner: string; addedBy: string }[];
  }>({ bundles: [], pipeline: [] });
  const [taskQueue, setTaskQueue] = useState<{
    active: string[];
    queued: string[];
  }>({ active: [], queued: [] });
  const [lastUpdate, setLastUpdate] = useState("");
  const [expandedDump, setExpandedDump] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Single API route — fetches all data from private wjpstudio/dashboard repo server-side
      const dashRes = await fetch("/api/dashboard-data");
      const dashData = dashRes.ok ? await dashRes.json() : {};

      const d = dashData.data;
      if (d) {
        setAgents(d.agents || {});
        setLastUpdate(d.updatedAt || "");
        if (d.taskQueue) {
          const normalize = (arr: unknown[]) =>
            arr.map((t) =>
              typeof t === "string" ? t : (t as Record<string, unknown>).task as string || JSON.stringify(t)
            );
          setTaskQueue({
            active: normalize(d.taskQueue.active || []),
            queued: normalize(d.taskQueue.queued || []),
          });
        }
      }

      const u = dashData.usage;
      if (u) {
        setUsage(u.agents || {});
        setUsageResets(u.weekResets || "");
      }

      if (dashData.kodo) setKodoData(dashData.kodo);

      if (dashData.needs) setNeedsWjp(dashData.needs.items || []);

      const p = dashData.products;
      if (p) setProducts({ bundles: p.bundles || [], pipeline: p.pipeline || [] });

      // Brain dumps — merge studio + wjp, sort by date
      const studioDumps: BrainDump[] = dashData.brainDumpsStudio?.dumps || [];
      const wjpDumps: BrainDump[] = dashData.brainDumpsWjp?.dumps || [];
      const merged = [...studioDumps, ...wjpDumps]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20);
      setBrainDumps(merged);
    } catch {
      /* silent */
    }

    // Treasury — on-chain balance fetches
    try {
      const [ethRes, usdcRes, solRes, priceRes] = await Promise.allSettled([
        fetch(BASE_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [TREASURY_BASE, "latest"],
          }),
        }),
        fetch(BASE_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "eth_call",
            params: [
              {
                to: USDC_BASE,
                data: `0x70a08231000000000000000000000000${TREASURY_BASE.slice(2)}`,
              },
              "latest",
            ],
          }),
        }),
        fetch(SOL_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 3,
            method: "getBalance",
            params: [TREASURY_SOL],
          }),
        }),
        fetch(COINGECKO),
      ]);

      const prices =
        priceRes.status === "fulfilled" && priceRes.value.ok
          ? await priceRes.value.json()
          : { ethereum: { usd: 0 }, solana: { usd: 0 } };

      const ethBal =
        ethRes.status === "fulfilled" && ethRes.value.ok
          ? parseInt((await ethRes.value.json()).result, 16) / 1e18
          : 0;

      const usdcBaseBal =
        usdcRes.status === "fulfilled" && usdcRes.value.ok
          ? parseInt((await usdcRes.value.json()).result, 16) / 1e6
          : 0;

      const solBal =
        solRes.status === "fulfilled" && solRes.value.ok
          ? (await solRes.value.json()).result?.value / 1e9
          : 0;

      const ethUsd = ethBal * (prices.ethereum?.usd || 0);
      const solUsd = solBal * (prices.solana?.usd || 0);
      const total = ethUsd + usdcBaseBal + solUsd;

      setTreasury({
        eth: ethBal.toFixed(4),
        ethUsd: `$${ethUsd.toFixed(2)}`,
        usdcBase: `$${usdcBaseBal.toFixed(2)}`,
        sol: solBal.toFixed(4),
        solUsd: `$${solUsd.toFixed(2)}`,
        total: `$${total.toFixed(2)}`,
      });
    } catch { /* silent */ }


  }, []);

  useEffect(() => {
    // Middleware handles auth server-side — no client-side cookie check needed
    // (dashboard_auth is httpOnly, JS can't read it)
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function handleLogout() {
    // Clear readable cookie client-side, then hit logout API to clear httpOnly cookie
    document.cookie =
      "dashboard_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // POST to logout API clears httpOnly cookie and redirects to /
    fetch("/api/auth/logout", { method: "POST", redirect: "follow" })
      .then(() => window.location.href = "/")
      .catch(() => window.location.href = "/");
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-bg/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pfp/wjp.png"
              alt="WJP"
              className="w-10 h-10 pixel-render border border-border"
              style={{ borderRadius: 0, imageRendering: "pixelated", backgroundColor: "#ffffff" }}
            />
            <h1 className="font-mono text-base tracking-[0.3em] text-foreground uppercase glitch-text">
              WJP
            </h1>
            <span className="font-mono text-[12px] text-muted/30 tracking-wider">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[12px] text-muted/30">
              {lastUpdate
                ? `${new Date(lastUpdate).toLocaleTimeString()}`
                : "—"}
            </span>
            <button
              onClick={handleLogout}
              className="font-mono text-[12px] text-muted hover:text-foreground transition-colors tracking-wider uppercase"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Agents ──────────────────────────────── */}
        <section className="mb-8">
          <h2 className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase mb-4">
            Agents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border">
            {AGENTS.map(({ key, name, role, pfp }) => {
              const agent = agents[key];
              const u = usage[key];
              return (
                <div key={key} className="bg-surface p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={pfp}
                      alt={name}
                      className="w-12 h-12 pixel-render border border-border"
                      style={{ borderRadius: 0, imageRendering: "pixelated" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Cursor
                          active={agent?.status === "active"}
                        />
                        <span className="font-mono text-base text-foreground">
                          {name}
                        </span>
                      </div>
                      <span className="font-mono text-[12px] text-muted/50 uppercase tracking-wider">
                        {role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[12px] font-mono mb-3">
                    <div className="flex justify-between">
                      <span className="text-muted">task</span>
                      <span className="text-foreground/60 truncate max-w-[120px] text-right">
                        {agent?.workingOn || "idle"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">ctx</span>
                      <span
                        className={
                          agent?.contextPct != null && agent.contextPct >= 80
                            ? "text-red-500"
                            : "text-foreground/60"
                        }
                      >
                        {agent?.contextPct != null ? `${agent.contextPct}%` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">model</span>
                      <span className="text-foreground/60">
                        {agent?.model
                          ?.replace("claude-", "")
                          .replace("-4-6", "") || "—"}
                      </span>
                    </div>
                  </div>

                  {u && (
                    <div className="space-y-1 pt-2 border-t border-border/50">
                      <UsageBar label="all" pct={u.allModels} />
                      <UsageBar label="sonnet" pct={u.sonnet} />
                      <UsageBar label="opus" pct={u.opus} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {usageResets && (
            <p className="font-mono text-[12px] text-muted/20 mt-1 text-right">
              resets{" "}
              {new Date(usageResets).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </section>

        <PixelDivider accent />

        {/* ── Task Board ──────────────────────────── */}
        <section className="my-8">
          <h2 className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase mb-4">
            Tasks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-border">
            <div className="bg-surface p-4">
              <p className="font-mono text-[12px] text-muted uppercase tracking-wider mb-3">
                Active
              </p>
              {kodoData?.activeTask ? (
                <p className="font-mono text-base text-foreground/80">
                  {typeof kodoData.activeTask === "string"
                    ? kodoData.activeTask
                    : kodoData.activeTask.name}
                </p>
              ) : taskQueue.active.length > 0 ? (
                <div className="space-y-1">
                  {taskQueue.active.map((t, i) => (
                    <p key={i} className="font-mono text-base text-foreground/80">
                      {typeof t === "string" ? t : (t as Record<string, unknown>).task as string || (t as Record<string, unknown>).name as string || "—"}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-base text-muted/30">none</p>
              )}
            </div>
            <div className="bg-surface p-4">
              <p className="font-mono text-[12px] text-muted uppercase tracking-wider mb-3">
                Queued
              </p>
              {taskQueue.queued.length > 0 ? (
                <div className="space-y-1">
                  {taskQueue.queued.map((t, i) => (
                    <p key={i} className="font-mono text-base text-muted/60">
                      {typeof t === "string" ? t : (t as Record<string, unknown>).task as string || (t as Record<string, unknown>).name as string || "—"}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-base text-muted/30">empty</p>
              )}
            </div>
          </div>
        </section>

        <PixelDivider />

        {/* ── Brain Dumps ─────────────────────────── */}
        <section className="my-8">
          <h2 className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase mb-4">
            Brain Dumps
          </h2>
          <div className="space-y-0">
            {brainDumps.map((dump) => (
              <div key={dump.id}>
                <button
                  onClick={() =>
                    setExpandedDump(
                      expandedDump === dump.id ? null : dump.id
                    )
                  }
                  className="w-full text-left py-3 flex items-baseline justify-between group"
                >
                  <span className="font-mono text-base text-foreground group-hover:text-accent transition-colors">
                    {dump.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="font-mono text-[12px] text-muted/30">{dump.date}</span>
                    <span className={`font-mono text-[12px] uppercase tracking-wider ${dump.source === "wjp+claud" ? "text-accent/50" : "text-muted/30"}`}>
                      {dump.source === "wjp+claud" ? "WJP" : "Studio"}
                    </span>
                  </div>
                </button>
                {expandedDump === dump.id && (
                  <div className="border border-border bg-surface p-4 mb-3 space-y-3">
                    <p className="font-mono text-[12px] text-muted/70 leading-relaxed">{dump.summary}</p>
                    {dump.keyDecisions.length > 0 && (
                      <div>
                        <p className="font-mono text-[12px] text-accent uppercase tracking-wider mb-1">Decisions</p>
                        {dump.keyDecisions.map((d, i) => (
                          <p key={i} className="font-mono text-[12px] text-foreground/60">→ {d}</p>
                        ))}
                      </div>
                    )}
                    {dump.pending.length > 0 && (
                      <div>
                        <p className="font-mono text-[12px] text-amber-500 uppercase tracking-wider mb-1">Pending</p>
                        {dump.pending.map((p, i) => (
                          <p key={i} className="font-mono text-[12px] text-muted/50">□ {p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <PixelDivider />
              </div>
            ))}
          </div>
        </section>

        <PixelDivider accent />

        {/* ── Products ────────────────────────────── */}
        {(products.bundles.length > 0 || products.pipeline.length > 0) && (
          <section className="my-8">
            <h2 className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase mb-4">
              Products
            </h2>

            {products.bundles.length > 0 && (
              <div className="mb-6">
                <p className="font-mono text-[12px] text-muted uppercase tracking-wider mb-3">Bundles</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-border">
                  {products.bundles.map((b) => (
                    <div key={b.id} className="bg-surface p-4">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-mono text-base text-foreground">{b.name}</span>
                        <span className="font-mono text-base text-accent">${b.price}</span>
                      </div>
                      <p className="font-mono text-[12px] text-muted/60 mb-2">{b.tagline}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {b.includes.map((p) => (
                          <span key={p} className="font-mono text-[12px] text-muted border border-border px-1">{p}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-[12px] uppercase tracking-wider ${b.status === "ready" ? "text-green-500" : "text-amber-500"}`}>
                          {b.status}
                        </span>
                        <span className="font-mono text-[12px] text-muted/40">
                          {b.addedBy === "wjp+claud" ? "WJP + Claud" : "Studio"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {products.pipeline.length > 0 && (
              <div>
                <p className="font-mono text-[12px] text-muted uppercase tracking-wider mb-3">Pipeline</p>
                <div className="border border-border bg-surface divide-y divide-border">
                  {products.pipeline.map((item) => (
                    <div key={item.id} className="p-3 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[12px] text-foreground/80">{item.name}</p>
                        <p className="font-mono text-[12px] text-muted/50 truncate">{item.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-[12px] uppercase ${item.status === "queued" ? "text-amber-500" : "text-muted/40"}`}>{item.status}</p>
                        <p className="font-mono text-[12px] text-muted/40">{item.addedBy === "wjp+claud" ? "WJP + Claud" : "Studio"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <PixelDivider accent />

        {/* ── Treasury ────────────────────────────── */}
        <section className="my-8">
          <h2 className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase mb-4">
            Treasury
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-border">
            {[
              {
                label: "ETH (Base)",
                val: treasury?.eth || "—",
                sub: treasury?.ethUsd,
              },
              {
                label: "USDC (Base)",
                val: treasury?.usdcBase || "—",
                sub: null,
              },
              {
                label: "SOL",
                val: treasury?.sol || "—",
                sub: treasury?.solUsd,
              },
              { label: "USDC (Sol)", val: "$0.00", sub: null },
            ].map((item) => (
              <div key={item.label} className="bg-surface p-4">
                <p className="font-mono text-[12px] text-muted uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p className="font-mono text-base text-foreground">{item.val}</p>
                {item.sub && (
                  <p className="font-mono text-[12px] text-muted/40 mt-0.5">
                    {item.sub}
                  </p>
                )}
              </div>
            ))}
          </div>
          {treasury?.total && (
            <div className="border-t border-border bg-surface p-4 mt-[1px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-accent uppercase tracking-wider">
                  Total
                </span>
                <span className="font-mono text-xl text-foreground">
                  {treasury.total}
                </span>
              </div>
            </div>
          )}
        </section>

        <PixelDivider />

        {/* ── Needs WJP ───────────────────────────── */}
        {needsWjp.length > 0 && (
          <section className="my-8">
            <h2 className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase mb-4">
              Needs WJP
            </h2>
            <div className="space-y-[1px] bg-border">
              {needsWjp.map((item, i) => (
                <div key={i} className="bg-surface p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-mono text-[12px] tracking-wider uppercase px-1.5 py-0.5 border ${
                        item.priority === "blocking"
                          ? "border-red-500/40 text-red-500"
                          : item.priority === "enabling"
                            ? "border-accent/40 text-accent"
                            : "border-border text-muted"
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="font-mono text-base text-foreground">
                      {item.title}
                    </span>
                  </div>
                  <p className="font-mono text-[12px] text-muted/50">
                    {item.ask}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <PixelDivider />

        {/* ── Cron Health ─────────────────────────── */}
        {kodoData?.cronJobs && kodoData.cronJobs.length > 0 && (
          <section className="my-8">
            <h2 className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase mb-4">
              Cron Jobs
            </h2>
            <div className="border border-border bg-surface p-4">
              {kodoData.cronJobs.map((job, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="font-mono text-[12px] text-foreground/60">
                    {job.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] text-muted/40">
                      {job.schedule}
                    </span>
                    <Cursor active={job.status === "active"} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent Outputs ──────────────────────── */}
        {kodoData?.recentOutputs && kodoData.recentOutputs.length > 0 && (
          <section className="my-8">
            <PixelDivider />
            <h2 className="font-mono text-[12px] tracking-[0.25em] text-muted uppercase mb-4 mt-8">
              Recent Outputs
            </h2>
            <div className="border border-border bg-surface p-4">
              {kodoData.recentOutputs.slice(0, 8).map((output, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between py-1"
                >
                  <span className="font-mono text-[12px] text-foreground/50 truncate max-w-[300px]">
                    {output.file || "—"}
                  </span>
                  <span className="font-mono text-[12px] text-muted/30">
                    {output.lines ? `${output.lines}L` : output.size ? `${Math.round(output.size / 1024)}K` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <span className="font-mono text-[12px] text-muted/20 tracking-widest">
            wjp.studio
          </span>
          <span className="font-mono text-[12px] text-muted/20">2026</span>
        </div>
      </footer>
    </div>
  );
}
// redeploy 1773207701
