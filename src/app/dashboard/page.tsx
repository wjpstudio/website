"use client";

import { useState, useEffect, useCallback } from "react";
import "./dashboard.css";

const BASE_RPC = "https://mainnet.base.org";
const SOL_RPC = "https://solana-rpc.publicnode.com";
const TREASURY_BASE = "0x51e0c3cb17e8AAb6391F40468A34E8e94aa1166E";
const TREASURY_SOL = "DPe3WqzeJisHPj4LyjRNcVgtUYUzJmmC4LkvUifadaLm";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const COINGECKO =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd";

interface AgentData {
  status: string;
  workingOn: string;
  contextPct: number | null;
  model: string;
  rateLimit: boolean;
}

interface BlockedItem {
  title: string;
  ask: string;
  priority: string;
  who?: string;
}

interface TaskItem {
  task: string;
  owner?: string;
  priority?: string;
  detail?: string;
  status?: string;
  completed?: string;
}

interface DirectiveData {
  id: string;
  statusSummary: string;
  riskAssessment: string;
  decisions: string;
  launchReadiness: string;
}

interface TreasuryData {
  eth: string;
  ethUsd: string;
  usdcBase: string;
  sol: string;
  solUsd: string;
  total: string;
}

interface DashboardState {
  updatedAt: string;
  agents: Record<string, AgentData>;
  needsWjp: BlockedItem[];
  blocked: BlockedItem[];
  tasks: {
    inProgress: TaskItem[];
    backlog: TaskItem[];
    completed: TaskItem[];
  };
  directive: DirectiveData;
}

const AGENT_CONFIG: Record<string, { name: string; role: string; pfpClass: string; pfp: string; model: string; contextColor: string }> = {
  claud: { name: "Claude", role: "CEO", pfpClass: "dash-pfp-claude", pfp: "/pfp/claud.png", model: "opus-4.6", contextColor: "#3b82f6" },
  kikai: { name: "Kikai", role: "Studio Ops Lead", pfpClass: "dash-pfp-kikai", pfp: "/pfp/kikai.png", model: "openclaw", contextColor: "#a855f7" },
  yama: { name: "Yama", role: "For Crypto Lead", pfpClass: "dash-pfp-yama", pfp: "/pfp/yama.png", model: "openclaw", contextColor: "#ff6000" },
  kodo: { name: "Kodo", role: "67 Lead", pfpClass: "dash-pfp-kodo", pfp: "/pfp/kodo.png", model: "openclaw", contextColor: "#22c55e" },
};

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "synced";
  }
}

function priorityClass(p: string): string {
  const lower = p.toLowerCase();
  if (lower === "blocked" || lower === "p0" || lower === "blocking") return "dash-priority-p0";
  if (lower === "p1" || lower === "high") return "dash-priority-p1";
  return "";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard-data");
      if (!res.ok) return;
      const json = await res.json();
      if (json.ceoSync) {
        setData(json.ceoSync);
      }
    } catch { /* silent */ }

    // Treasury on-chain
    try {
      const [ethRes, usdcRes, solRes, priceRes] = await Promise.allSettled([
        fetch(BASE_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [TREASURY_BASE, "latest"] }),
        }),
        fetch(BASE_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: USDC_BASE, data: `0x70a08231000000000000000000000000${TREASURY_BASE.slice(2)}` }, "latest"] }),
        }),
        fetch(SOL_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "getBalance", params: [TREASURY_SOL] }),
        }),
        fetch(COINGECKO),
      ]);

      const prices = priceRes.status === "fulfilled" && priceRes.value.ok
        ? await priceRes.value.json()
        : { ethereum: { usd: 0 }, solana: { usd: 0 } };

      const ethBal = ethRes.status === "fulfilled" && ethRes.value.ok
        ? parseInt((await ethRes.value.json()).result, 16) / 1e18 : 0;
      const usdcBaseBal = usdcRes.status === "fulfilled" && usdcRes.value.ok
        ? parseInt((await usdcRes.value.json()).result, 16) / 1e6 : 0;
      const solBal = solRes.status === "fulfilled" && solRes.value.ok
        ? (await solRes.value.json()).result?.value / 1e9 : 0;

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
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const blocked = data?.blocked || data?.needsWjp || [];
  const agents = data?.agents || {};
  const tasks = data?.tasks || { inProgress: [], backlog: [], completed: [] };
  const directive = data?.directive;

  // Extract risks from directive
  const risks: string[] = [];
  if (directive?.riskAssessment) {
    const lines = directive.riskAssessment.split("\n");
    for (const line of lines) {
      const m = line.match(/^\d+\.\s+(.+)/);
      if (m) risks.push(m[1].trim());
      const m2 = line.match(/^- (.+)/);
      if (m2 && !m) risks.push(m2[1].trim());
    }
  }

  // Extract intel from directive decisions
  const intelItems: { source: string; text: string }[] = [];
  if (directive?.decisions) {
    const lines = directive.decisions.split("\n");
    for (const line of lines) {
      const trimmed = line.replace(/^[-*]\s*/, "").trim();
      if (trimmed.length > 15 && intelItems.length < 6) {
        intelItems.push({ source: "CEO", text: trimmed });
      }
    }
  }

  const treasuryItems = [
    { token: "SOL", balance: treasury?.sol || "...", usd: treasury?.solUsd || "" },
    { token: "ETH", balance: treasury?.eth || "...", usd: treasury?.ethUsd || "" },
    { token: "USDC", balance: treasury?.usdcBase || "...", usd: "" },
  ];

  return (
    <div className="dash-app">
      {/* Nav */}
      <nav className="dash-nav">
        <span className="dash-nav-logo">WJP Studio</span>
        <div className="dash-nav-tabs">
          <span className="dash-nav-tab active">Dashboard</span>
          <span className="dash-nav-tab">Office</span>
        </div>
        <div className="dash-nav-status">
          <span className="dash-nav-dot" />
          <span>{data?.updatedAt ? timeAgo(data.updatedAt) : "loading..."}</span>
        </div>
      </nav>

      {/* Grid */}
      <div className="dash-grid">
        {/* YOUR MOVE */}
        <div className="dash-module dash-yourmove dash-fade">
          <div className="dash-module-header">
            <h2 className="dash-module-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/pfp/wjp.png" alt="WJP" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
              <span className="dash-yourmove-accent">YOUR MOVE</span>
            </h2>
            {blocked.length > 0 && (
              <span className="dash-module-badge" style={{ color: "var(--dash-red)", background: "var(--dash-red-dim)" }}>
                {blocked.length}
              </span>
            )}
          </div>
          <div className="dash-module-body">
            {blocked.length === 0 ? (
              <div className="dash-move-empty">Nothing blocking the studio right now.</div>
            ) : (
              blocked.map((item, i) => (
                <div className="dash-move-item" key={i}>
                  <div className="dash-move-title">{item.title}</div>
                  <div className="dash-move-what">{item.ask}</div>
                  <div className="dash-move-meta">
                    {item.who && <span>Blocks: {item.who}</span>}
                    {item.priority && <span className={`dash-task-priority ${priorityClass(item.priority)}`}>{item.priority}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AGENTS */}
        <div className="dash-module dash-agents dash-fade" style={{ animationDelay: "0.05s" }}>
          <div className="dash-module-header">
            <h2 className="dash-module-title">AGENTS</h2>
          </div>
          <div className="dash-module-body">
            <div className="dash-agents-grid">
              {Object.entries(AGENT_CONFIG).map(([key, cfg]) => {
                const agent = agents[key];
                const isOnline = agent?.status === "active" || key === "claud";

                return (
                  <div className="dash-agent-card" key={key}>
                    <div className="dash-agent-top">
                      <div className={`dash-agent-pfp ${cfg.pfpClass}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cfg.pfp} alt={cfg.name} />
                      </div>
                      <div className="dash-agent-info">
                        <span className="dash-agent-name">{cfg.name}</span>
                        <span className="dash-agent-role">{cfg.role}</span>
                      </div>
                      <span className={`dash-agent-dot ${isOnline ? "dash-dot-online" : "dash-dot-offline"}`} />
                    </div>
                    <div className="dash-agent-task-row">
                      <span className="dash-agent-task-label">Task</span>
                      <span className="dash-agent-task-text">
                        {key === "claud"
                          ? "CEO operations + launch coordination"
                          : agent?.workingOn || "no data"}
                      </span>
                    </div>
                    <div className="dash-agent-model">{cfg.model}</div>
                    <div className="dash-agent-ctx-bar">
                      <div
                        className="dash-agent-ctx-fill"
                        style={{
                          width: `${agent?.contextPct || (key === "claud" ? 45 : 0)}%`,
                          background: cfg.contextColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CEO DIRECTIVE */}
        <div className="dash-module dash-directive dash-fade" style={{ animationDelay: "0.1s" }}>
          <div className="dash-module-header">
            <h2 className="dash-module-title">CEO DIRECTIVE</h2>
          </div>
          <div className="dash-module-body">
            {!directive?.statusSummary ? (
              <div className="dash-move-empty">No directives issued yet.</div>
            ) : (
              <div className="dash-directive-card">
                {directive.launchReadiness && (
                  <div className="dash-directive-time">Launch readiness: {directive.launchReadiness}</div>
                )}
                <div className="dash-directive-summary">{directive.statusSummary}</div>
                {risks.length > 0 && (
                  <div className="dash-directive-risks">
                    <div className="dash-directive-risks-title">TOP RISKS</div>
                    {risks.slice(0, 5).map((risk, i) => (
                      <div className="dash-risk-item" key={i}>
                        <span className="dash-risk-num">{i + 1}.</span>
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TASK BOARD */}
        <div className="dash-module dash-taskboard dash-fade" style={{ animationDelay: "0.1s" }}>
          <div className="dash-module-header">
            <h2 className="dash-module-title">TASK BOARD</h2>
          </div>
          <div className="dash-module-body">
            <div className="dash-task-columns">
              <div className="dash-task-col dash-col-active">
                <div className="dash-task-col-header">
                  <span className="dash-task-col-title">Active</span>
                  <span className="dash-task-col-count">{tasks.inProgress.length}</span>
                </div>
                <div className="dash-task-col-items">
                  {tasks.inProgress.length === 0 ? (
                    <div className="dash-task-empty">None</div>
                  ) : (
                    tasks.inProgress.map((t, i) => (
                      <div className="dash-task-item" key={i}>
                        <span className="dash-task-item-title">{t.task}</span>
                        <div className="dash-task-item-meta">
                          {t.owner && <span className="dash-task-item-owner">{t.owner}</span>}
                          {t.priority && <span className={`dash-task-priority ${priorityClass(t.priority)}`}>{t.priority}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="dash-task-col dash-col-queued">
                <div className="dash-task-col-header">
                  <span className="dash-task-col-title">Queued</span>
                  <span className="dash-task-col-count">{tasks.backlog.length}</span>
                </div>
                <div className="dash-task-col-items">
                  {tasks.backlog.length === 0 ? (
                    <div className="dash-task-empty">None</div>
                  ) : (
                    tasks.backlog.map((t, i) => (
                      <div className="dash-task-item" key={i}>
                        <span className="dash-task-item-title">{t.task}</span>
                        <div className="dash-task-item-meta">
                          {t.owner && <span className="dash-task-item-owner">{t.owner}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="dash-task-col dash-col-done">
                <div className="dash-task-col-header">
                  <span className="dash-task-col-title">Done</span>
                  <span className="dash-task-col-count">{tasks.completed.length}</span>
                </div>
                <div className="dash-task-col-items">
                  {tasks.completed.length === 0 ? (
                    <div className="dash-task-empty">None</div>
                  ) : (
                    tasks.completed.slice(0, 10).map((t, i) => (
                      <div className="dash-task-item" key={i}>
                        <span className="dash-task-item-title">{t.task}</span>
                        <div className="dash-task-item-meta">
                          {t.owner && <span className="dash-task-item-owner">{t.owner}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT QUEUE */}
        <div className="dash-module dash-content dash-fade" style={{ animationDelay: "0.15s" }}>
          <div className="dash-module-header">
            <h2 className="dash-module-title">CONTENT QUEUE</h2>
          </div>
          <div className="dash-module-body">
            <div className="dash-content-empty">
              <div className="dash-content-empty-icon">Q</div>
              <div className="dash-content-empty-text">No content pending approval</div>
              <div className="dash-content-empty-note">
                Agents will submit posts here for WJP to approve, reject, or give feedback before publishing.
              </div>
            </div>
          </div>
        </div>

        {/* INTELLIGENCE */}
        <div className="dash-module dash-intel dash-fade" style={{ animationDelay: "0.2s" }}>
          <div className="dash-module-header">
            <h2 className="dash-module-title">INTELLIGENCE</h2>
            {intelItems.length > 0 && (
              <span className="dash-module-badge" style={{ color: "var(--dash-accent)", background: "var(--dash-accent-dim)" }}>
                {intelItems.length}
              </span>
            )}
          </div>
          <div className="dash-module-body">
            <div className="dash-intel-items">
              {intelItems.length === 0 ? (
                <div className="dash-intel-empty">No intelligence gathered yet.</div>
              ) : (
                intelItems.map((item, i) => (
                  <div className="dash-intel-item" key={i}>
                    <div className="dash-intel-source">{item.source}</div>
                    <div className="dash-intel-text">{item.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TREASURY */}
        <div className="dash-module dash-treasury dash-fade" style={{ animationDelay: "0.2s" }}>
          <div className="dash-module-header">
            <h2 className="dash-module-title">TREASURY</h2>
            {treasury?.total && (
              <span className="dash-module-badge" style={{ color: "var(--dash-green)", background: "var(--dash-green-dim)" }}>
                {treasury.total}
              </span>
            )}
          </div>
          <div className="dash-module-body">
            <div className="dash-treasury-items">
              {treasuryItems.map((item, i) => (
                <div className="dash-treasury-row" key={i}>
                  <span className="dash-treasury-token">{item.token}</span>
                  <div>
                    <span className="dash-treasury-balance">{item.balance}</span>
                    {item.usd && <span className="dash-treasury-usd"> {item.usd}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
