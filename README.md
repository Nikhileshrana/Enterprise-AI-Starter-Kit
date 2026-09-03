# Enterprise Ready AI Starter Kit

A production-ready **Next.js starter kit** for building **enterprise-grade AI applications** — multi-tenant auth, organization management, AI agents, file storage, and a full shadcn/ui design system in one repo.

Ship faster with auth, RBAC, streaming chat, tool-calling agents, and a polished UI already wired together.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.7-000)
![AI SDK](https://img.shields.io/badge/AI_SDK-v7-000)

## What's included

### Application core

| Module | Purpose |
|--------|---------|
| **Next.js 16** | App Router, Server Components, Cache Components |
| **React 19** | Latest React with Compiler support |
| **TypeScript** | End-to-end type safety |
| **Tailwind CSS v4** | Utility-first styling with CSS variables |
| **Biome** | Fast linting and formatting |

### Authentication

| Module | Purpose |
|--------|---------|
| **Better Auth** | Cookie-based sessions, MongoDB adapter |
| **Google OAuth** | Social sign-in |
| **Protected routes** | Optimistic middleware gate + server session validation |
| **Rate limiting** | Database-backed request limits |

### Multi-tenancy

| Module | Purpose |
|--------|---------|
| **Organizations** | Create, switch, and manage workspaces |
| **RBAC** | Owner, admin, and member roles with permission helpers |
| **Invitations** | Invite teammates to an organization |
| **Member settings** | Sortable data table, role updates, org deletion |

### Data & storage

| Module | Purpose |
|--------|---------|
| **MongoDB** | Primary database via official driver |
| **Chat history** | Persist and restore AI conversations |
| **Vercel Blob** | Client and server file uploads |

### AI platform

| Module | Purpose |
|--------|---------|
| **Vercel AI Gateway** | Unified routing to Claude, GPT, Gemini, DeepSeek, and more |
| **AI SDK v7** | Streaming, tool calling, agent loops |
| **Tool-loop agent** | Multi-step agent with 12-step cap and reasoning |
| **Chat UI** | Attachments, model picker, history, artifact panel |

### AI capabilities

| Module | Purpose |
|--------|---------|
| **Generative UI tools** | Weather, stock, and search result cards |
| **Human-in-the-loop** | User confirmations, questionnaires, approval gates |
| **Perplexity search** | Live web search via AI Gateway |
| **Document artifacts** | HTML reports, proposals, and code artifacts |
| **File attachments** | JPEG, PNG, GIF, WebP, PDF, CSV in chat |
| **Export** | PDF and PNG export for generated artifacts |

### UI system

| Module | Purpose |
|--------|---------|
| **shadcn/ui** | 60+ accessible components (Base UI + Mira style) |
| **Themes** | Dark / light via `next-themes` |
| **Layout** | Collapsible sidebar, mobile top bar and bottom nav |
| **Data tables** | TanStack Table with sorting and pagination |
| **Charts** | Recharts integration |
| **Chat primitives** | Message scroller, bubbles, attachments, markers |

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # Landing + Google sign-in
│   ├── protected/
│   │   ├── dashboard/           # Authenticated home
│   │   ├── chat/                # AI chat workspace
│   │   └── settings/            # Members & organization settings (page.tsx)
│   └── api/
│       ├── auth/[...all]/       # Better Auth handler
│       ├── chat/                # AI streaming + history
│       └── blob/                # Vercel Blob uploads
├── components/
│   ├── ai/                      # Chat, artifacts, tool cards
│   └── ui/                      # shadcn/ui components
└── lib/
    ├── auth/                    # Server + client auth, permissions
    ├── ai/                      # Agent, tools, models, gateway
    ├── db/                      # MongoDB + chat persistence
    └── blob/                    # Blob path helpers + client upload
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.4+ (or Node.js 20+)
- MongoDB database
- Google OAuth credentials
- Vercel AI Gateway key (or linked Vercel project with OIDC)

### Environment variables

Create a `.env.local` file:

```bash
# Database
MONGODB_URI=
DB_NAME=
NEXT_PUBLIC_DB_NAME=          # must match DB_NAME

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI (Vercel AI Gateway)
AI_GATEWAY_API_KEY=             # or VERCEL_OIDC_TOKEN via `vercel env pull`
AI_GATEWAY_MODEL=openai/gpt-5.4 # optional default model

# Optional
TOOL_APPROVAL_SECRET=           # defaults to BETTER_AUTH_SECRET
```

### Install & run

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Production build |
| `bun start` | Start production server |
| `bun lint` | Run Biome checks |
| `bun format` | Format with Biome |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with module overview and Google sign-in |
| `/protected/dashboard` | Authenticated dashboard |
| `/protected/chat` | AI chat with tools, artifacts, and history |
| `/protected/settings` | Organization members, invitations, and roles |

## Deploy on Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add environment variables (or run `vercel env pull`).
4. Deploy — Fluid Compute runs API routes and the AI chat endpoint.

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.

## License

Private — see repository owner for usage terms.
