import type { ConversationCommandName, ConversationCommands } from "./conversation-commands.types";

const target = new EventTarget();

const EVENT_PREFIX = "conversation-command:";

export function dispatchConversationCommand<Name extends ConversationCommandName>(
  name: Name,
  payload: ConversationCommands[Name]
): void {
  target.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}${name}`, { detail: payload }));
}

export function subscribeConversationCommand<Name extends ConversationCommandName>(
  name: Name,
  handler: (payload: ConversationCommands[Name]) => void
): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<ConversationCommands[Name]>).detail);
  };

  target.addEventListener(`${EVENT_PREFIX}${name}`, listener);
  return () => {
    target.removeEventListener(`${EVENT_PREFIX}${name}`, listener);
  };
}
