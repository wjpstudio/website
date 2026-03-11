import { NextResponse } from "next/server";

const REPO = "wjpstudio/dashboard";
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

export async function GET() {
  const [data, usage, kodo, needs, products, studio, wjp] = await Promise.allSettled([
    fetchFile("data.json"),
    fetchFile("data/usage.json"),
    fetchFile("data/kodo.json"),
    fetchFile("needs-wjp.json"),
    fetchFile("data/products.json"),
    fetchFile("data/brain-dumps-studio.json"),
    fetchFile("data/brain-dumps-wjp.json"),
  ]);

  const val = <T>(r: PromiseSettledResult<T>) =>
    r.status === "fulfilled" ? r.value : null;

  return NextResponse.json({
    data: val(data),
    usage: val(usage),
    kodo: val(kodo),
    needs: val(needs),
    products: val(products),
    brainDumpsStudio: val(studio),
    brainDumpsWjp: val(wjp),
  });
}
