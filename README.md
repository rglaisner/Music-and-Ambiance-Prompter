# Music-and-Ambiance-Prompter

Playing around making zik. This repo contains the Vite + React app; Gemini calls run on Vercel serverless so the API key stays server-side.


## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and set `GEMINI_API_KEY` (used only by Vercel serverless locally, not bundled into the browser).
3. **Full stack (UI + `/api/*`):** install the [Vercel CLI](https://vercel.com/docs/cli), run `vercel link` once, then `vercel dev`. Gemini calls run on the server; the key stays in environment variables.
4. **Vite only:** `npm run dev` — the UI runs, but music and ambiance generation will fail until API routes are reachable (use `vercel dev` for generation).

## Deploy on Vercel

1. Push this repo to GitHub and import the project in the [Vercel dashboard](https://vercel.com/new).
2. Framework: **Vite** (build: `npm run build`, output: `dist`).
3. In **Settings → Environment Variables**, add `GEMINI_API_KEY` for Production and Preview (and Local if you use `vercel dev` with linked env).
4. Deploy. Serverless functions live under `/api/music` and `/api/ambiance`; the API key is never exposed to the client bundle.
