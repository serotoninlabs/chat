import React, { useEffect, useCallback, useState } from "react";
import { ChatManagerContext } from "../ChatManager";
import { ChatMessage } from "../services/ChatService";
import { MessageWrapper } from "../services/ChatStorage";

export function useConversation(conversationId: string) {
  const [initialized, setInitialized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { service } = React.useContext(ChatManagerContext);

  useEffect(() => {
    async function init() {
      const messages = await service.storage.getAllFromConversation(
        conversationId
      );
      setMessages(messages.map((m) => m.message));
      setInitialized(true);
    }

    init();
  }, []);

  const onMessageReceived = useCallback(
    (message: MessageWrapper) => {
      console.log("new message", message);
      setMessages(messages.concat([message.message]));
    },
    [service, messages]
  );

  useEffect(() => {
    let subscriptionId: string;
    if (initialized) {
      console.log("subscribed to convo");
      subscriptionId = service.storage.subscribeToConversation(
        conversationId,
        (message) => onMessageReceived(message)
      );
    }

    return () => {
      subscriptionId &&
        service.storage.unsubscribeFromCoversation(subscriptionId);
    };
  }, [initialized, onMessageReceived]);

  return {
    messages,
    address: service.address,
    send: service.send.bind(service),
  };
}
