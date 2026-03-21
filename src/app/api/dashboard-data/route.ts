import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const REPO = "kikaionchain/dashboard";
const BRANCH = "main";
const GH_TOKEN = process.env.GITHUB_TOKEN;
const FC_SYNC_URL = "https://www.forcrypto.market/api/studio/sync";

async function fetchFile(path: string) {
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.raw",
  };
  if (GH_TOKEN) headers["Authorization"] = `token ${GH_TOKEN}`;
  const res = await fetch(url, { headers, next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

async function readCeoSyncData() {
  try {
    const filePath = join(process.cwd(), "public", "dashboard-data.json");
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function fetchLiveAgentData() {
  const secret = process.env.STUDIO_SYNC_SECRET;
  if (!secret) return null;
  try {
    const res = await fetch(FC_SYNC_URL, {
      headers: { Authorization: `Bearer ${secret}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  // Live agent data from FC (Neon DB - persistent, real-time)
  const liveAgents = await fetchLiveAgentData();

  // CEO sync data (static JSON, updated by LaunchAgent)
  const ceoSync = await readCeoSyncData();

  // Merge live agent data into ceoSync if available
  if (liveAgents?.agents && ceoSync) {
    const agentMap: Record<string, unknown> = {};
    for (const agent of liveAgents.agents) {
      const key = agent.name === "claude" ? "claud" : agent.name;
      agentMap[key] = {
        status: agent.status === "alive" || agent.status === "active" ? "active" : agent.status,
        workingOn: agent.currentTask ?? agent.workingOn ?? "",
        contextPct: null,
        model: key === "claud" ? "opus-4.6" : "claude-code",
        rateLimit: false,
        lastSeenAt: agent.lastSeenAt,
        role: agent.role ?? "",
        lastCommit: agent.lastCommit ?? "",
        lastCommitMessage: agent.lastCommitMessage ?? "",
      };
    }
    ceoSync.agents = { ...ceoSync.agents, ...agentMap };
    ceoSync.liveActivity = liveAgents.activity ?? [];
    ceoSync.liveIncidents = liveAgents.incidents ?? [];
  }

  // Legacy GitHub Pages data (fallback)
  const [data, usage, kodo, kikai, yama, needs, products, studio, wjp] = await Promise.allSettled([
    fetchFile("data.json"),
    fetchFile("data/usage.json"),
    fetchFile("data/kodo.json"),
    fetchFile("data/kikai.json"),
    fetchFile("data/yama.json"),
    fetchFile("needs-wjp.json"),
    fetchFile("data/products.json"),
    fetchFile("data/brain-dumps-studio.json"),
    fetchFile("data/brain-dumps-wjp.json"),
  ]);

  const val = <T>(r: PromiseSettledResult<T>) =>
    r.status === "fulfilled" ? r.value : null;

  return NextResponse.json({
    ceoSync,
    liveAgents,
    data: val(data),
    usage: val(usage),
    kodo: val(kodo),
    kikai: val(kikai),
    yama: val(yama),
    needs: val(needs),
    products: val(products),
    brainDumpsStudio: val(studio),
    brainDumpsWjp: val(wjp),
  });
}
