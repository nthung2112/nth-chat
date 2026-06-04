# NTH Chat

A privacy-first chat application that runs a large language model entirely in the browser. NTH Chat talks to Chrome's built-in on-device model (the Prompt API / Gemini Nano) through `window.LanguageModel`, so prompts and responses never leave the machine. There is no backend, no API key, and no network round trip for inference.

## Technology Stack

| Area            | Choice                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| UI library      | React 19                                                                          |
| Language        | TypeScript 6 (strict)                                                             |
| Build tool      | Vite 8                                                                            |
| Routing         | TanStack Router (file-based, automatic code splitting)                            |
| Styling         | Tailwind CSS v4, `tw-animate-css`, `@tailwindcss/typography`                      |
| Components      | shadcn/ui (`base-vega` style) on Base UI primitives                               |
| State           | Zustand (with `persist` to `localStorage`)                                        |
| AI types        | `ai` (Vercel AI SDK `Message` type)                                               |
| Markdown        | `react-markdown` + `remark-gfm`, `react-code-blocks`                              |
| Forms           | `react-hook-form` + `zod`                                                         |
| Icons           | `lucide-react`                                                                    |
| Motion          | `framer-motion`                                                                   |
| Extras          | `emoji-mart`, `react-dropzone`, `react-resizable-panels`, `sonner`, `next-themes` |
| Package manager | pnpm                                                                              |

On-device AI types come from `@types/dom-chromium-ai` and speech input types from `@types/dom-speech-recognition`.

## Project Architecture

NTH Chat is a single-page React app with no server. Inference is delegated to the browser's built-in model.

```
Route (/, /c)
  -> ChatLayout (resizable sidebar + chat)
       -> useConversationController          (wires UI to state + AI)
            -> useLocalChat                  (message list, streaming, abort, reload)
                 -> streamPrompt / session   (lib/local-ai: Prompt API wrapper)
                      -> window.LanguageModel (Chrome on-device model)
       -> Zustand stores (persisted)         (conversations, preferences, prompts)
```

Key boundaries:

- `src/lib/local-ai` is the only place that touches the browser `LanguageModel` global. It exposes availability checks, a cached session factory keyed by system prompt, and a streaming prompt helper with `AbortSignal` support.
- Chat sessions are cloned per request and destroyed afterwards, while the base session is cached by system prompt to avoid repeated model warm-up.
- Conversations and user preferences persist to `localStorage` through Zustand `persist`, so history survives reloads without a database.
- At build time, a custom Vite plugin (`scripts/vite-plugin-static-routes.mjs`) duplicates `dist/index.html` into one folder per static route, producing clean-URL output any static host can serve.

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm.
- A Chromium-based browser with the built-in Prompt API (Gemini Nano) enabled. Without it, the UI loads but reports the model as `unavailable`. The app uses `window.LanguageModel.availability()` and triggers an on-device model download (with progress) on first use.

### Install

```bash
pnpm install
```

### Run in development

```bash
pnpm dev
```

The dev server starts on port 3400 (http://localhost:3400).

### Build and preview

```bash
pnpm build
pnpm preview
```

### Configuration

The base path is controlled by `VITE_BASE_URL`:

- `.env.local` sets `VITE_BASE_URL=./` for relative-path hosting.
- `.env.production` sets a subpath base for deployment.

In development the base is always `/`.

## Project Structure

```
src/
  routes/             TanStack Router file routes (__root, index "/", c "/c")
  features/
    conversation/     Chat screen: topbar, list, message, bottombar, controller
  components/
    layout/           App sidebar, chat layout, nav user
    chat/, ui/        shadcn/ui and chat primitives (bubble, input, message list)
    *.tsx             Forms, emoji picker, markdown, code block, mode toggle, etc.
  lib/
    local-ai/         Browser Prompt API wrapper (availability, session, hooks)
    browser/          Clipboard, file encoding, speech recognition helpers
    prompt-roles/     Built-in system-prompt presets
  stores/             Zustand stores (conversation, composer, prompt, model-download, user-preferences)
  hooks/              useAutoScroll, useSpeechRecognition, use-mobile, useCustomEvent
  providers/          Theme provider
  utils/, env.d.ts    Style helpers and ambient types
scripts/              Static-route prerender Vite plugin + tests
public/               manifest.json and static assets
```

## Key Features

- On-device LLM chat with token streaming, stop, and reload of the last turn.
- Model lifecycle handling: availability detection, one-click download with progress, and graceful fallback when the browser lacks the Prompt API.
- Persistent conversation history per chat id, stored locally and reopened via `/c?id=...`.
- Prompt roles: preset system prompts for translation, grammar checking, developer assistance, auto-correct, and auto-detect.
- Username onboarding dialog to personalise the experience.
- Markdown rendering with GitHub-flavoured markdown and syntax-highlighted code blocks.
- Composer extras: image embedding (base64), drag-and-drop, emoji picker, and speech-to-text input.
- Dark and light themes (default dark) via `next-themes`.
- Resizable sidebar and chat panes.

## Development Workflow

1. Create a branch for the change.
2. Run `pnpm dev` and iterate.
3. Before opening a pull request, run the checks below and ensure they pass.

```bash
pnpm type-check     # tsc --noEmit
pnpm lint           # eslint ./src
pnpm format         # prettier --write ./src
```

## Coding Standards

- TypeScript strict mode is on. Prefer explicit, well-named types.
- Use the `@/` path alias for imports from `src`; avoid deep relative paths.
- Immutability: build new objects instead of mutating state, matching the Zustand store patterns.
- Keep the `LanguageModel` global isolated inside `src/lib/local-ai`; do not call it directly from components.
- Imports are sorted by `@trivago/prettier-plugin-sort-imports`; Tailwind classes by `prettier-plugin-tailwindcss`. Unused imports are flagged by `eslint-plugin-unused-imports`.

## License

No license is currently declared in `package.json`. Add a license file before distributing.
