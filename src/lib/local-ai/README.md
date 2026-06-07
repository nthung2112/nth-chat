# @nth-chat/local-ai

Framework-agnostic in-browser chat engine over Chrome's on-device Prompt API
(`window.LanguageModel`, Gemini Nano). No backend, no network calls: all
inference runs locally in a supported browser. React hooks are provided as an
optional layer on top of the framework-agnostic core.

## Layers

The package is split so the core never imports React:

| Layer      | File                     | Responsibility                                          | Depends on             |
| ---------- | ------------------------ | ------------------------------------------------------- | ---------------------- |
| Platform   | `language-model.ts`      | `window.LanguageModel` detection, availability, session | -                      |
| Session    | `session.ts`             | session cache, streaming, transport interface + default | platform               |
| Messages   | `message.ts`             | `ChatMessage` type + helpers, data URL utils            | -                      |
| Engine     | `conversation-engine.ts` | framework-agnostic conversation store                   | session, messages      |
| React      | `hooks.ts`               | `useLocalAI`, `useLocalChat`                            | engine, session, react |
| Public API | `index.ts`               | barrel re-exports                                       | all                    |

`react` is an optional peer dependency. Import only the core modules when
building a non-React integration; the engine exposes a `subscribe`/`getState`
store that binds to any UI layer.

## Install

```bash
pnpm add @nth-chat/local-ai
# React hooks are optional:
pnpm add react
```

The package has no runtime dependencies. `ChatMessage` is a local type that is
structurally compatible with the Vercel AI SDK `UIMessage` (text and file
parts), so messages can be passed to/from `ai` SDK utilities without adapters.

## Availability and download

```ts
import { getAvailability, isLanguageModelSupported } from "@nth-chat/local-ai";

if (isLanguageModelSupported()) {
  const status = await getAvailability();
  // "unavailable" | "downloadable" | "downloading" | "available"
}
```

## React usage

```tsx
import { useLocalAI, useLocalChat } from "@nth-chat/local-ai";

function Chat({ id }: { id: string }) {
  const localAI = useLocalAI();
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useLocalChat({
    id,
    initialMessages: [],
    system: "You are a helpful assistant.",
    isReady: localAI.isReady,
  });

  return null;
}
```

`triggerDownload` from `useLocalAI` must be called from a user gesture to start
the model download.

## Headless usage (no React)

```ts
import { createConversationEngine, localAITransport } from "@nth-chat/local-ai";

const engine = createConversationEngine({
  initialMessages: [],
  transport: localAITransport,
  getSystem: () => "You are a helpful assistant.",
  getIsReady: () => true,
  getCallbacks: () => ({ onFinish: message => console.log(message) }),
  getIsActive: () => true,
});

const unsubscribe = engine.subscribe(() => console.log(engine.getState()));
engine.submit("Hello");
```

## Custom transport

`localAITransport` streams through the on-device model. Supply any object
implementing `ConversationTransport` to back the engine with a different source.

```ts
import type { ConversationTransport } from "@nth-chat/local-ai";

const transport: ConversationTransport = {
  async stream({ user, onChunk }) {
    onChunk(user);
    return user;
  },
};
```

## One-shot structured prompt

`runPrompt` sends a single prompt and returns the full response as a string. It
clones the cached system session per call, so prior turns never leak into the
result. Pass a JSON Schema via `responseConstraint` to force the model to emit
JSON matching that shape.

```ts
import { runPrompt } from "@nth-chat/local-ai";

const schema = {
  type: "object",
  properties: {
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    score: { type: "number" },
  },
  required: ["sentiment", "score"],
} as const;

const raw = await runPrompt({
  system: "You classify the sentiment of the user's text.",
  user: "I absolutely love this product!",
  responseConstraint: schema,
});

const result = JSON.parse(raw) as { sentiment: string; score: number };
```

Parameters:

| Name                 | Type                      | Required | Description                                              |
| -------------------- | ------------------------- | -------- | -------------------------------------------------------- |
| `system`             | `string`                  | yes      | System prompt; keys the cached base session.             |
| `user`               | `string`                  | yes      | The single user prompt to run.                           |
| `responseConstraint` | `Record<string, unknown>` | yes      | JSON Schema the response must conform to.                |
| `signal`             | `AbortSignal`             | no       | Aborts the request; the cloned session is then disposed. |

Use `runPrompt` for stateless calls (classification, extraction, summarisation).
For multi-turn chat with streaming, use `useLocalChat` or the engine instead.

```ts
const controller = new AbortController();
const promise = runPrompt({
  system: "Extract the city name as JSON.",
  user: "I flew to Tokyo last week.",
  responseConstraint: { type: "object", properties: { city: { type: "string" } } },
  signal: controller.signal,
});
controller.abort();
```

## Publishing

The sources ship as TypeScript. Before publishing to a registry, add a build
step (for example `tsc` or `tsup`) that emits `dist` JS + `.d.ts`, then point
`main`, `module`, `types`, and `exports` at the build output.
