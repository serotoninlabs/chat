import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import {
  ChatService,
  ChatState,
  Conversation,
  ConversationState,
} from "./services/ChatService";

export interface Manager {
  state: ChatState;
  service: ChatService;
}

const defaultContext = { messages: [], async onSend(content: string) {} };
// @ts-ignore ignore setting undefined
const ChatManagerContext = React.createContext<Manager>();

export const ChatManager: React.FC<{ service: ChatService }> = ({
  children,
  service,
}) => {
  const [manager, setManager] = useState<Manager>({
    service,
    state: service.getState(),
  });
  useEffect(() => {
    service.onStateChange((state) => setManager({ service, state }));
    return () => {
      // TODO unsubscribe
    };
  }, [service]);

  return (
    <ChatManagerContext.Provider value={manager}>
      {children}
    </ChatManagerContext.Provider>
  );
};

export const ManagedChatWindow: React.FC<{ conversationId: string }> = ({
  conversationId,
}) => {
  const { service } = React.useContext(ChatManagerContext);
  const [conversation, setConversation] = useState<Conversation>();
  const [state, setState] = useState<ConversationState>();
  useEffect(() => {
    service.startConversation(conversationId).then(setConversation);
  }, [service, conversationId]);
  useEffect(() => {
    if (conversation) {
      conversation.onStateChange(setState);
    }
  }, [conversation]);

  const onSend = useCallback(
    async (content: string) => {
      if (!conversation) {
        throw new Error("invalid state - conversation undefined");
      }
      conversation.send(content);
    },
    [conversation]
  );

  return (
    <ChatWindow messages={(state && state.messages) || []} onSend={onSend} />
  );
};
