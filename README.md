# beta-epic

AI-powered UI configuration studio — chat with Claude to generate, preview, and iterate on component-based UIs using a declarative DSL. Supports plain text prompts, image attachments, and Figma URL imports.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Current Input Support](#current-input-support)
- [Tech Stack](#tech-stack)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 20 |
| pnpm | >= 9 |
| MongoDB | Atlas cluster (or local) |
| OpenAI account | API key with GPT-4/5 access |
| Figma account | OAuth app credentials (optional, for Figma import) |

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

---

## Environment Setup

Create `apps/web/.env.local` (copy from the template below):

```bash
# ── OpenAI ──────────────────────────────────────────────────────────────────
# Required. Powers the chat and config generation.
OPENAI_API_KEY=sk-proj-...

# ── MongoDB ─────────────────────────────────────────────────────────────────
# Required. Password for your Atlas cluster (or full URI if self-hosted).
MONGODB_DB_PASSWORD=your-password

# ── Figma OAuth ─────────────────────────────────────────────────────────────
# Optional. Required only for Figma URL import and screenshot features.
# Create an OAuth app at https://www.figma.com/developers/apps
FIGMA_CLIENT_ID=your-figma-client-id
FIGMA_CLIENT_SECRET=your-figma-client-secret
FIGMA_OAUTH_REDIRECT_URI=http://localhost:3000/api/figma/oauth/callback

# Optional: personal access token as a fallback (bypasses OAuth).
FIGMA_ACCESS_TOKEN=figd_...
```

> **MongoDB URI** is constructed inside `apps/web/src/lib/mongodb.ts` using `MONGODB_DB_PASSWORD`. If you use a different connection string format, update that file.

---

## Installation

```bash
# Clone the repo
git clone <repo-url>
cd beta-epic

# Install all workspace dependencies
pnpm install

# Build the shared UI package first
pnpm build --filter @beta-epic/ui
```

---

## Running the App

```bash
# Start all apps in dev mode (Turborepo)
pnpm dev

# Or start only the web app
pnpm dev --filter web
```

The web app runs at **http://localhost:3000**.

Other commands:

```bash
pnpm build        # Production build (all workspaces)
pnpm typecheck    # TypeScript check across all workspaces
```

---

## Project Structure

```
beta-epic/
├── apps/
│   └── web/                   # Main Next.js 15 application
│       └── src/
│           ├── app/
│           │   ├── api/       # REST endpoints (chats, files, figma oauth)
│           │   ├── chat/[id]/ # Main studio interface
│           │   └── chats/     # Chat list page
│           └── lib/
│               ├── master-prompt.ts   # Studio system prompt
│               ├── figma-rest.ts      # Figma REST client
│               ├── figma-oauth.ts     # Figma OAuth helpers
│               ├── mongodb.ts         # DB connection
│               ├── dsl-validation.ts  # DSL syntax checker
│               └── tools/             # AI tool definitions
└── packages/
    └── ui/                    # Shared component + DSL library
        └── src/
            ├── components/ui/ # shadcn components + registry
            ├── engine/        # DSL types and engine
            └── context-helpers/ # DSL rules injected into prompts
```

---

## Current Input Support

### 1. Text Prompts

Send any natural-language instruction in the chat. Claude uses the studio system prompt and DSL rules to interpret requests and generate or update workspace config files.

Examples:
- `"Build a sales dashboard with a KPI row and a revenue chart"`
- `"Add a dark mode toggle to the theme tokens"`
- `"Replace the table with a card grid layout"`

### 2. Image Attachments

Paste or attach images directly in the chat input (up to **8 images** per message). Images are sent to the model as vision context, useful for:

- Sharing a screenshot of an existing UI to replicate
- Attaching a rough wireframe or mockup
- Providing a reference screenshot for layout feedback

Supported formats: PNG, JPEG, WebP, GIF.

### 3. Figma URLs

Paste any Figma URL into the chat. Supported URL types:

| Format | Example |
|--------|---------|
| Design/frame | `https://www.figma.com/design/<file-key>/...?node-id=...` |
| File | `https://www.figma.com/file/<file-key>/...` |
| Prototype | `https://www.figma.com/proto/<file-key>/...` |
| Board | `https://www.figma.com/board/<file-key>/...` |

When a Figma URL is provided, the studio can:

- **Fetch design context** — extracts layout, typography, color, and spacing from the Figma node tree
- **Capture a screenshot** — renders the Figma frame and sends the image to the model
- **Visual review** — compare the rendered preview against the Figma reference and iterate

Figma features require either OAuth authentication (triggered automatically) or a `FIGMA_ACCESS_TOKEN` in your env file.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| AI | OpenAI SDK 4.x (GPT-4/5, streaming) |
| Database | MongoDB 6 (Atlas) |
| Monorepo | Turborepo 2 + pnpm workspaces |
| Figma | Figma REST API + OAuth |
| Preview capture | html2canvas |
| Charts | Recharts |
