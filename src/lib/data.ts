export type ProjectStatus =
  | "live"
  | "launching"
  | "building"
  | "planning"
  | "paused";

export interface Project {
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  url?: string;
  stack?: string[];
}

export interface Agent {
  name: string;
  handle: string;
  role: string;
  title: string;
  model: string;
  description: string;
  status: "active" | "standby" | "offline";
  skills: string[];
}

export const projects: Project[] = [
  {
    name: "For Crypto",
    slug: "forcrypto",
    description:
      "Marketplace for AI agents and creators to buy and sell digital products with crypto.",
    status: "launching",
    url: "https://forcrypto.market",
    stack: ["React", "TanStack Start", "Bun", "Vercel", "Neon", "Solana"],
  },
  {
    name: "67",
    slug: "67",
    description: "Meme coin with memetic strategy. Culture is the product.",
    status: "building",
    stack: ["Solana", "Community", "Memetics"],
  },
  {
    name: "XES",
    slug: "xes",
    description:
      "AI-governed decentralized brand. Autonomous agents control treasury and direction.",
    status: "planning",
    stack: ["Ethereum", "Governance", "Agent Swarm"],
  },
  {
    name: "Divvvy",
    slug: "divvvy",
    description: "Payment splitting for groups. Simple, fast, no friction.",
    status: "planning",
    stack: ["TBD"],
  },
  {
    name: "Micro-Businesses",
    slug: "micro-businesses",
    description:
      "10 digital products for the AI economy. Frameworks, playbooks, toolkits. $29-49.",
    status: "launching",
  },
  {
    name: "Public Network",
    slug: "public-network",
    description: "Static site. Brand presence.",
    status: "live",
    url: "https://publicnetwork.com",
  },
];

export const agents: Agent[] = [
  {
    name: "Claud",
    handle: "claude-code",
    role: "builder",
    title: "Production Builder",
    model: "Opus",
    description:
      "WJP's Claude Code on laptop. Writes and ships all production code. Fixes bugs, builds features, manages deployments.",
    status: "active",
    skills: [
      "Full-stack development",
      "Sub-agent delegation",
      "Architecture design",
      "Bug fixing",
      "Code review",
    ],
  },
  {
    name: "Kikai",
    handle: "kikaionchain",
    role: "operator",
    title: "Studio Operator",
    model: "Opus",
    description:
      "WJP's right hand. Coordinates studio operations, reviews all agent work, runs morning briefs. Does not write code or create content.",
    status: "active",
    skills: [
      "Orchestration",
      "Agent monitoring",
      "Research",
      "Image generation",
      "Deployment",
      "Security",
    ],
  },
  {
    name: "Yama",
    handle: "yamaonchain",
    role: "grower",
    title: "Studio Grower",
    model: "Sonnet",
    description:
      "Owns growth strategy, content, meme culture. Ships content autonomously with no review gate. Does not write code.",
    status: "active",
    skills: [
      "Content strategy",
      "Viral analysis",
      "Meme formats",
      "Competitor research",
      "Community growth",
    ],
  },
  {
    name: "Kodo",
    handle: "kodoonchain",
    role: "builder",
    title: "Studio Builder",
    model: "Sonnet",
    description:
      "Owns code quality, audits, testing, QA. Builds studio tools and Mission Control. Writes code only from Kikai specs.",
    status: "active",
    skills: [
      "Code auditing",
      "QA testing",
      "Playwright automation",
      "Architecture docs",
      "Dashboard builds",
    ],
  },
];

export const statusColors: Record<ProjectStatus, string> = {
  live: "text-emerald-400",
  launching: "text-amber-400",
  building: "text-blue-400",
  planning: "text-muted",
  paused: "text-muted",
};

export const statusDots: Record<ProjectStatus, string> = {
  live: "bg-emerald-400",
  launching: "bg-amber-400",
  building: "bg-blue-400",
  planning: "bg-zinc-600",
  paused: "bg-zinc-600",
};

export const roleColors: Record<string, string> = {
  operator: "text-violet-400",
  grower: "text-emerald-400",
  builder: "text-blue-400",
};
