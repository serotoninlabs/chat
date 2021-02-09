import React from "react";
import { ChatMessageProps, ChatWindow } from ".";
import { useConversation } from "../hooks/useConversation";

export const ManagedChatWindow: React.FC<{
  conversationId: string;
  messageComponent?: React.FC<ChatMessageProps>;
}> = ({ conversationId, messageComponent }) => {
  const { messages, send, userId, conversationMetadata } = useConversation(
    conversationId
  );

  return (
    <ChatWindow
      currentUser={userId}
      messages={messages}
      messageComponent={messageComponent}
      conversationMetadata={conversationMetadata}
      onSend={(content) => send(conversationId, content)}
    />
  );
};
