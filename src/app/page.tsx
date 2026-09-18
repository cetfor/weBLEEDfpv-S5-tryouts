import scoreboard from "../../public/data/scoreboard.json";

type Pilot = {
  rank: number;
  name: string;
  totalMs: number;
  times: Record<string, number>;
};

const tracks = [
  { key: "T1", title: "Tinyhawk" },
  { key: "T2", title: "Hummingbird RS" },
  { key: "T3", title: "Cetus Pro" },
];

function formatTime(milliseconds: number) {
  return (milliseconds / 1000).toFixed(3);
}

export default function Home() {
  const pilots = scoreboard.pilots as Pilot[];
  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
          <div className="display text-xl font-bold tracking-[-0.04em]">
            weBLEED<span className="text-[var(--orange)]">fpv</span>
          </div>
          <div className="mono text-xs uppercase tracking-[0.16em] text-[#8d9792]">
            Season 05 / Qualifiers
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono mb-3 text-xs uppercase tracking-[0.2em] text-[var(--orange)]">
              Standings
            </p>
            <h1 className="display text-5xl font-bold tracking-[-0.06em]">
              Season 5 Qualifier Board
            </h1>
          </div>
          <p className="mono text-right text-xs text-[#8d9792]">
            {scoreboard.generatedAt === ""
              ? "Awaiting sync"
              : `Updated ${new Date(scoreboard.generatedAt).toLocaleString()}`}
            <br />
            Times shown in seconds
          </p>
        </div>

        {pilots.length > 0 ? (
          <div className="overflow-x-auto border border-[var(--line)]">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-[var(--paper)]">
                <tr className="mono border-b border-[var(--line)] text-xs uppercase tracking-[0.12em] text-[#8d9792]">
                  <th className="px-5 py-4 font-normal">Rank</th>
                  <th className="px-5 py-4 font-normal">Pilot</th>
                  {tracks.map((track) => (
                    <th
                      key={track.key}
                      className="px-5 py-4 text-right font-normal"
                    >
                      {track.key} / {track.title}
                    </th>
                  ))}
                  <th className="px-5 py-4 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {pilots.map((pilot) => (
                  <tr
                    key={pilot.name}
                    className="border-b border-[var(--line)] last:border-b-0 hover:bg-[#1d2226]"
                  >
                    <td className="mono px-5 py-4 text-sm text-[#8d9792]">
                      {String(pilot.rank).padStart(2, "0")}
                    </td>
                    <th className="display px-5 py-4 text-left text-lg font-semibold">
                      {pilot.name}
                    </th>
                    {tracks.map((track) => (
                      <td
                        key={track.key}
                        className="mono px-5 py-4 text-right text-sm"
                      >
                        {formatTime(pilot.times[track.key])}
                      </td>
                    ))}
                    <td className="mono px-5 py-4 text-right text-sm font-semibold text-[var(--acid)]">
                      {formatTime(pilot.totalMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-[var(--line)] bg-[var(--paper)] px-6 py-14 text-center">
            <div className="display text-3xl font-bold">
              First sync pending.
            </div>
            <p className="mx-auto mt-3 max-w-md text-[#8d9792]">
              The scoreboard will populate when the hourly public leaderboard
              sync completes.
            </p>
          </div>
        )}
      </section>

      <footer className="border-t border-[var(--line)] px-5 py-6 lg:px-8">
        <div className="mono mx-auto flex max-w-6xl justify-between text-xs uppercase tracking-[0.12em] text-[#8d9792]">
          <span>weBLEEDfpv / 2026</span>
          <span>All times in seconds</span>
        </div>
      </footer>
    </main>
  );
}
