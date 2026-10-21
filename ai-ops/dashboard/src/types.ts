// Shape of data/dashboard.json, written by ai-ops/src/dashboard.ts.

export type RoomId = "bridge" | "research" | "studio" | "publishing" | "treasury";

export interface Agent {
  agent: string;
  callsign: string;
  role: string;
  room: RoomId;
  active: boolean;
  task: string;
  spendMonth: number;
  playbook: { rules: number; latest: string[] };
}

export interface Product {
  id: string;
  title: string;
  priceUsd: number;
  lane: "A" | "B";
  created: string;
  status: string;
  thumb: string | null;
}

export interface Dashboard {
  generatedAt: string;
  shopName: string;
  mode: "DRY RUN" | "AUTOPILOT";
  health: "NOMINAL" | "ISSUES";
  money: { aiMonth: number; aiCap: number; totalMonth: number; totalCap: number; lastRun: number };
  etsy: { connected: boolean; revenue: number; orders: number; views: number; live: number };
  rooms: Record<RoomId, string>;
  agents: Agent[];
  approvals: { id: string; listings: number; feesUsd: number; url: string }[];
  uploads: string[];
  products: Product[];
  backlog: { name: string; lane: "A" | "B"; priceUsd: number; sellBy: string }[];
  report: string;
  log: string[];
}
