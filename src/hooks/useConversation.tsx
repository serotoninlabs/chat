import React, { useEffect, useCallback, useState, useReducer } from "react";
import { ChatManagerContext } from "../components/ChatManager";
import { ChatMessage, ConversationMetadata } from "../services/ChatService";
import { MessageWrapper } from "../services/ChatStorage";

function reducer(
  messages: ChatMessage[],
  newMessages: ChatMessage[]
): ChatMessage[] {
  return messages.concat(newMessages);
}

export function useConversation(conversationId: string) {
  const [initialized, setInitialized] = useState(false);
  const { service } = React.useContext(ChatManagerContext);

  const [messages, addMessages] = useReducer(reducer, []);
  const [
    conversationMetadata,
    setConversationMetadata,
  ] = useState<ConversationMetadata>();

  useEffect(() => {
    async function init() {
      const messages = await service.storage.getAllFromConversation(
        conversationId
      );
      addMessages(messages.map((m) => m.message));
      setInitialized(true);
    }

    init();
  }, []);

  const onMessageReceived = useCallback(
    (message: MessageWrapper) => {
      console.log("new message", message);
      addMessages([message.message]);
    },
    [service]
  );

  useEffect(() => {
    let subscriptionId: string;
    if (initialized) {
      console.log("subscribed to convo");
      subscriptionId = service.storage.subscribeToConversation(
        conversationId,
        (message) => onMessageReceived(message)
      );
      service.remote.getConversationMetadata(conversationId).then((x) => {
        setConversationMetadata(x);
      });
    }

    return () => {
      subscriptionId &&
        service.storage.unsubscribeFromCoversation(subscriptionId);
    };
  }, [initialized, onMessageReceived]);

  return {
    messages,
    userId: service.signal.getAddress().userId,
    send: service.send.bind(service),
    conversationMetadata,
  };
}
