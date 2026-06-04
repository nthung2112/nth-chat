## Project Overview

`nth-chat` is a privacy-first, backend-free single-page chat app: all LLM inference runs in-browser via Chrome's on-device Prompt API (Gemini Nano), built with React 19, TypeScript, Vite, and TanStack Router.

## Tech Stack

- Language: TypeScript `~6.0.3` (strict mode, target ES2023, `moduleResolution: bundler`)
- Runtime / Framework: React 19, Vite 8 SPA
- Routing: TanStack Router (file-based, generated `src/routeTree.gen.ts`)
- State: Zustand 5 with `persist` to `localStorage` (no backend/database)
- AI: Chrome on-device Prompt API (`window.LanguageModel`); Vercel AI SDK (`ai`) for the `Message` type only
- UI: shadcn/ui (style `base-vega`), Base UI primitives, Tailwind CSS v4 (CSS-first config in `src/global.css`), lucide-react
- Forms/validation: react-hook-form + zod
- Package Manager: pnpm (Node 20+)

## Structural Map

```
nth-chat/
|- vite.config.ts                # Vite config: Tailwind, TanStack Router, static-route prerender, @ alias, port 3400
|- tsconfig.json                 # Single TS config (strict, @/* -> src/*)
|- eslint.config.mjs             # Flat ESLint config (type-imports, unused-imports, style rules)
|- components.json               # shadcn/ui config (some fields stale; see Notes)
|- index.html                    # SPA HTML shell (mounts #root)
|- scripts/
|  |- vite-plugin-static-routes.mjs  # Build plugin: duplicates dist/index.html per static route for clean URLs
|  \- extract-static-routes.mjs      # Parses routeTree.gen.ts to enumerate static routes
|- public/                       # manifest.json, icons, static assets
\- src/
   |- main.tsx                   # Entrypoint: builds TanStack Router + RouterProvider, imports global.css
   |- routeTree.gen.ts           # Generated route tree (do NOT hand-edit)
   |- global.css                 # Tailwind v4 entry + theme tokens (replaces JS tailwind config)
   |- routes/
   |  |- __root.tsx              # Root layout route
   |  |- index.tsx               # "/" route (new chat)
   |  \- c.tsx                   # "/c?id=..." route (existing conversation)
   |- features/
   |  \- conversation/           # Chat feature UI
   |     \- use-conversation-controller.ts  # Orchestrator: wires UI <-> stores <-> local AI, persistence, nav
   |- lib/
   |  |- local-ai/               # SOLE boundary touching window.LanguageModel
   |  |  |- index.ts             # Public barrel (availability, hooks, session, message helpers)
   |  |  |- session.ts           # Cached session factory, streamPrompt/runPrompt, abort
   |  |  |- use-local-ai.ts      # Hook: model availability + download lifecycle
   |  |  \- use-local-chat.ts    # Hook: message list, streaming, stop, reload
   |  |- browser/                # Clipboard, file-encoder (base64), speech-recognition wrappers
   |  |- prompt-roles/           # Built-in system-prompt presets
   |  \- utils.ts                # Shared lib utility
   |- stores/                    # Zustand stores (barrel in index.ts); persisted to localStorage
   |  \- ...                     # conversation, composer, prompt, model-download, user-preferences
   |- components/
   |  |- layout/                 # app-sidebar, chat-layout, nav-user, new-chat-dialog
   |  \- ui/                     # shadcn/ui primitives (+ ui/chat chat primitives)
   |- hooks/                     # useAutoScroll, useSpeechRecognition, use-mobile, useCustomEvent
   |- providers/                 # theme-provider (next-themes)
   \- utils/styles.ts            # cn() class-merge helper
```

## Development Guide

```
# Install
pnpm install

# Dev server (http://localhost:3400)
pnpm dev

# Build
pnpm build

# Typecheck (canonical)
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

No test runner exists in this repo. Verify changes with:

```
pnpm type-check && pnpm lint && pnpm build
```

## Notes

- Confine all `window.LanguageModel` access to `src/lib/local-ai`; never call it from components.
- Use the `@/` alias for `src` imports; avoid deep relative paths.
- `consistent-type-imports` is enforced: use `import type`. Unused imports/vars are errors (prefix intentional unused with `_`).
- Prettier: double quotes, semicolons, printWidth 100, `arrowParens: avoid`, `trailingComma: es5`. Import order and Tailwind class order are auto-sorted.
- Do not hand-edit `src/routeTree.gen.ts`.
- Image prompts are blocked: the on-device model does not support image input.
- Stale config to ignore: `components.json` references a non-existent `tailwind.config.ts` (Tailwind v4 config lives in `src/global.css`) and sets `rsc: true` despite this being a client-only SPA.
