import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChatMessageProps } from "./components/ChatMessage";
import { ChatWindow } from "./components/ChatWindow";
import { useConversation } from "./hooks/useConversation";
import { ChatService, ChatState } from "./services/ChatService";

export interface Manager {
  service: ChatService;
}

// @ts-ignore ignore setting undefined
export const ChatManagerContext = React.createContext<Manager>();

export const ChatManager: React.FC<{ service: ChatService }> = ({
  children,
  service,
}) => {
  return (
    <ChatManagerContext.Provider value={{ service }}>
      {children}
    </ChatManagerContext.Provider>
  );
};

export const ManagedChatWindow: React.FC<{
  conversationId: string;
  messageComponent?: React.FC<ChatMessageProps>;
}> = ({ conversationId, messageComponent }) => {
  const { messages, send, userId } = useConversation(conversationId);

  return (
    <ChatWindow
      currentUser={userId}
      messages={messages}
      messageComponent={messageComponent}
      onSend={(content) => send(conversationId, content)}
    />
  );
};
