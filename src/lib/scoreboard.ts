export const REQUIRED_TRACKS = {
  T1: { title: "weBLEEDfpv Season 5 T1", quad: "Tiny Hawk" },
  T2: {
    title: "weBLEEDfpv Season 5 T2",
    quad: "Hummingbird RS",
  },
  T3: { title: "weBLEEDfpv Season 5 T3", quad: "Cetus PRO" },
} as const;

export type PilotScore = {
  rank: number;
  name: string;
  totalMs: number;
  times: Record<string, number>;
};
export type Scoreboard = {
  generatedAt: string;
  source: string;
  pilots: PilotScore[];
};

type Entry = Record<string, unknown>;
const text = (value: unknown) =>
  typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : "";
const pickText = (entry: Entry, keys: string[]) =>
  keys.map((key) => text(entry[key])).find(Boolean) ?? "";

function milliseconds(value: unknown): number | null {
  if (typeof value === "number")
    return value < 1000 ? Math.round(value * 1000) : Math.round(value);
  if (typeof value !== "string") return null;
  const parts = value.trim().split(":");
  const seconds =
    parts.length === 2
      ? Number(parts[0]) * 60 + Number(parts[1])
      : Number(value);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
}

function entries(payload: unknown): Entry[] {
  if (Array.isArray(payload))
    return payload.filter(
      (item): item is Entry => !!item && typeof item === "object",
    );
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Entry;
  for (const key of ["results", "data", "leaderboard", "times", "scores"]) {
    const found = entries(object[key]);
    if (found.length) return found;
  }
  return [object];
}

export function normalizeScoreboard(
  payload: unknown,
  generatedAt = new Date().toISOString(),
): Scoreboard {
  const byPilot = new Map<string, Record<string, number>>();
  for (const entry of entries(payload)) {
    const trackTitle = pickText(entry, [
      "track",
      "trackName",
      "course",
      "courseName",
      "title",
      "name",
    ]);
    const track = (
      Object.keys(REQUIRED_TRACKS) as Array<keyof typeof REQUIRED_TRACKS>
    ).find((key) => trackTitle === REQUIRED_TRACKS[key].title);
    const quad = pickText(entry, ["quad", "quadName", "vehicle", "aircraft"]);
    const time = milliseconds(
      entry.timeMs ?? entry.time ?? entry.milliseconds ?? entry.duration,
    );
    const pilot = pickText(entry, [
      "pilot",
      "pilotName",
      "username",
      "userName",
      "player",
      "playerName",
    ]);
    if (
      !track ||
      quad !== REQUIRED_TRACKS[track].quad ||
      !pilot ||
      time === null
    )
      continue;
    const scores = byPilot.get(pilot) ?? {};
    scores[track] = Math.min(scores[track] ?? Number.MAX_SAFE_INTEGER, time);
    byPilot.set(pilot, scores);
  }
  const pilots = [...byPilot.entries()]
    .filter(([, times]) =>
      Object.keys(REQUIRED_TRACKS).every((track) => times[track] !== undefined),
    )
    .map(([name, times]) => ({
      name,
      times,
      totalMs: Object.values(times).reduce((sum, time) => sum + time, 0),
      rank: 0,
    }))
    .sort((a, b) => a.totalMs - b.totalMs || a.name.localeCompare(b.name))
    .map((pilot, index) => ({ ...pilot, rank: index + 1 }));
  return { generatedAt, source: "Velocidrone API", pilots };
}
