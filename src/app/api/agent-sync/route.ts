import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");
const AGENTS_FILE = join(DATA_DIR, "agents.json");
const ACTIVITY_FILE = join(DATA_DIR, "activity.json");
const MAX_ACTIVITY = 200;

interface AgentState {
  name: string;
  status: "active" | "idle" | "offline";
  role: string;
  workingOn: string;
  lastCommit?: string;
  lastCommitMessage?: string;
  filesChanged?: number;
  blockers?: string[];
  completedToday?: string[];
  lastSyncAt: string;
}

interface ActivityEntry {
  agent: string;
  type: "commit" | "sync" | "alert" | "directive";
  message: string;
  timestamp: string;
}

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(path: string, data: unknown) {
  await ensureDir();
  await writeFile(path, JSON.stringify(data, null, 2));
}

function verifySecret(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  const secret = process.env.STUDIO_SYNC_SECRET;
  if (!secret) return false;
  return token === secret;
}

// POST: Agent pushes its state
export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      status,
      role,
      workingOn,
      lastCommit,
      lastCommitMessage,
      filesChanged,
      blockers,
      completedToday,
      activityMessage,
      activityType,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    // Update agent state
    const agents = await readJson<Record<string, AgentState>>(AGENTS_FILE, {});
    agents[name] = {
      name,
      status: status ?? "active",
      role: role ?? agents[name]?.role ?? "",
      workingOn: workingOn ?? agents[name]?.workingOn ?? "",
      lastCommit: lastCommit ?? agents[name]?.lastCommit,
      lastCommitMessage: lastCommitMessage ?? agents[name]?.lastCommitMessage,
      filesChanged: filesChanged ?? agents[name]?.filesChanged,
      blockers: blockers ?? agents[name]?.blockers ?? [],
      completedToday: completedToday ?? agents[name]?.completedToday ?? [],
      lastSyncAt: new Date().toISOString(),
    };
    await writeJson(AGENTS_FILE, agents);

    // Add activity entry if provided
    if (activityMessage) {
      const activity = await readJson<ActivityEntry[]>(ACTIVITY_FILE, []);
      activity.unshift({
        agent: name,
        type: activityType ?? "sync",
        message: activityMessage,
        timestamp: new Date().toISOString(),
      });
      // Keep only last N entries
      await writeJson(ACTIVITY_FILE, activity.slice(0, MAX_ACTIVITY));
    }

    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

// GET: Dashboard reads all agent states + activity
export async function GET(request: NextRequest) {
  // Auth check for dashboard (cookie or bearer token)
  const auth = request.cookies.get("dashboard_auth");
  const bearerAuth = request.headers.get("authorization");
  const secret = process.env.STUDIO_SYNC_SECRET;

  const isCookieAuth = auth?.value === "1";
  const isBearerAuth = secret && bearerAuth === `Bearer ${secret}`;

  if (!isCookieAuth && !isBearerAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await readJson<Record<string, AgentState>>(AGENTS_FILE, {});
  const activity = await readJson<ActivityEntry[]>(ACTIVITY_FILE, []);

  // Mark agents as offline if no sync in 30 min
  const staleThreshold = Date.now() - 30 * 60 * 1000;
  for (const agent of Object.values(agents)) {
    if (new Date(agent.lastSyncAt).getTime() < staleThreshold) {
      agent.status = "offline";
    }
  }

  return NextResponse.json({
    agents: Object.values(agents),
    activity: activity.slice(0, 50),
    lastUpdated: new Date().toISOString(),
  });
}
