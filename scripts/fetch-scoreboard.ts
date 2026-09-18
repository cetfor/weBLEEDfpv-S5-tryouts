import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { PilotScore, Scoreboard } from "../src/lib/scoreboard";

const MAX_ENTRIES = 200;
const TRACKS = [
  {
    key: "T1",
    url: "https://www.velocidrone.com/leaderboard/105/2174/All",
    model: "Tiny Hawk",
  },
  {
    key: "T2",
    url: "https://www.velocidrone.com/leaderboard/105/2175/All",
    model: "Hummingbird RS",
  },
  {
    key: "T3",
    url: "https://www.velocidrone.com/leaderboard/33/2176/All",
    model: "Cetus PRO",
  },
] as const;

type TrackKey = (typeof TRACKS)[number]["key"];
type TrackScore = { name: string; timeMs: number };

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function parseMilliseconds(value: string) {
  const parts = value.trim().split(":");
  const seconds =
    parts.length === 2
      ? Number(parts[0]) * 60 + Number(parts[1])
      : Number(value);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
}

function parseTrack(html: string, model: string): TrackScore[] {
  const table = html.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] ?? "";
  const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].slice(0, MAX_ENTRIES);
  return rows.flatMap((row) => {
    const cells = [...row[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (cell) => decodeHtml(cell[1]),
    );
    const timeMs = parseMilliseconds(cells[1] ?? "");
    const name = cells[2] ?? "";
    const rowModel = cells[5] ?? "";
    if (!name || timeMs === null || rowModel !== model) return [];
    return [{ name, timeMs }];
  });
}

async function fetchTrack(url: string, model: string) {
  const response = await fetch(url, {
    headers: { Accept: "text/html", "User-Agent": "wbsb-scoreboard/1.0" },
  });
  if (!response.ok)
    throw new Error(`Velocidrone returned ${response.status} for ${url}`);
  return parseTrack(await response.text(), model);
}

function bestTimes(entries: TrackScore[]) {
  const times = new Map<string, number>();
  for (const entry of entries) {
    times.set(
      entry.name,
      Math.min(times.get(entry.name) ?? Number.MAX_SAFE_INTEGER, entry.timeMs),
    );
  }
  return times;
}

async function main() {
  const fetched = await Promise.all(
    TRACKS.map(async (track) => ({
      ...track,
      times: bestTimes(await fetchTrack(track.url, track.model)),
    })),
  );
  const eligibleNames = [...fetched[0].times.keys()].filter((name) =>
    fetched.every((track) => track.times.has(name)),
  );
  const pilots: PilotScore[] = eligibleNames
    .map((name) => {
      const times = Object.fromEntries(
        fetched.map((track) => [track.key, track.times.get(name)!]),
      ) as Record<TrackKey, number>;
      return {
        name,
        times,
        totalMs: Object.values(times).reduce((sum, time) => sum + time, 0),
        rank: 0,
      };
    })
    .sort((a, b) => a.totalMs - b.totalMs || a.name.localeCompare(b.name))
    .map((pilot, index) => ({ ...pilot, rank: index + 1 }));
  const scoreboard: Scoreboard = {
    generatedAt: new Date().toISOString(),
    source: TRACKS.map((track) => track.url).join(" | "),
    pilots,
  };
  const outputPath = path.join(
    process.cwd(),
    "public",
    "data",
    "scoreboard.json",
  );
  await writeFile(
    outputPath,
    `${JSON.stringify(scoreboard, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Wrote ${scoreboard.pilots.length} eligible pilots from ${MAX_ENTRIES}-entry track scans to ${outputPath}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
