import { useEffect, useRef } from "react";

import { subscribeConversationCommand } from "./conversation-command-bus";
import type { ConversationCommandName, ConversationCommands } from "./conversation-commands.types";

export function useConversationCommand<Name extends ConversationCommandName>(
  name: Name,
  handler: (payload: ConversationCommands[Name]) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(
    () => subscribeConversationCommand(name, payload => handlerRef.current(payload)),
    [name]
  );
}
