import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { useConversation } from "./hooks/useConversation";
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
export const ChatManagerContext = React.createContext<Manager>();

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
  const { messages, send, address } = useConversation(conversationId);

  return (
    <ChatWindow
      currentUser={address.userId}
      messages={messages}
      onSend={(content) => send(conversationId, content)}
    />
  );
};
