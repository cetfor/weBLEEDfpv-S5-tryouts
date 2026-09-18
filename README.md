# weBLEEDfpv Season 5 Qualifier Board

Static GitHub Pages scoreboard for the three-track Velocidrone tryouts. The GitHub Action runs every 15 minutes, fetches the three public leaderboard pages, keeps only pilots with a qualifying model and a time on every track, ranks them by combined time, and commits the generated `public/data/scoreboard.json` file.

## Local development

```bash
npm install
npm run dev
```

The public board can be built with `npm run build`; Next.js exports it to `out/`.

## GitHub setup

The update workflow runs every 15 minutes and can also be started manually from the Actions tab. It reads the public T1, T2, and T3 leaderboard pages, scans up to their top 200 entries, commits changed standings, builds the static site, and deploys it to GitHub Pages. Enable GitHub Pages from Settings > Pages, selecting GitHub Actions as the source.

For a project Pages URL such as `https://owner.github.io/repository`, the deploy workflow automatically sets the required base path.

## Private WebSocket capture

GitHub Pages cannot keep a WebSocket connection open. For a personal live collector, copy `config/velocidrone.example.json` to `config/velocidrone.json`, set the Velocidrone computer's LAN IP, and run:

```powershell
Copy-Item config/velocidrone.example.json config/velocidrone.json
# Edit config/velocidrone.json with the endpoint and credentials
npm run capture-websocket
```

The Velocidrone socket does not use an API token or subscription payload. It is a local race-manager telemetry socket at `ws://<localIP>:60003/velocidrone` and requires an empty heartbeat every 10 seconds. Raw non-empty messages are written to `data/websocket-messages.ndjson` for inspection. The local config and capture directory are ignored by Git. Messages use `racestatus` and `racedata` envelopes; the collector can be mapped to track and quad metadata once a capture is available.
