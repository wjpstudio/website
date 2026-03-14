import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const REPO = "kikaionchain/dashboard";
const BRANCH = "main";
const GH_TOKEN = process.env.GITHUB_TOKEN;

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

export async function GET() {
  // CEO sync data (primary source, updated every 30 min by LaunchAgent)
  const ceoSync = await readCeoSyncData();

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
