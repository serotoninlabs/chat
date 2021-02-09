import { Meta } from "@storybook/react";
import { useCallback, useEffect, useState } from "react";
import faker from "faker";
import { ChatWindow as ChatWindowComponent } from "./ChatWindow";
import { ChatMessage } from "../services/ChatService";
import { AddressFromString } from "../services/SignalService";
export default {
  title: "Chat/Window",
  component: ChatWindowComponent,
} as Meta;

const users = ["alice", "bob"];

export const ChatWindow = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    randomMessage(),
    randomMessage(),
    randomMessage(),
    randomMessage(),
    randomMessage(),
    randomMessage(),
    randomMessage(),
    randomMessage(),
    randomMessage(),
  ]);
  function randomMessage(): ChatMessage {
    return {
      conversationId: "test",
      sender: users[faker.random.number(1)],
      messageId: faker.random.uuid(),
      content: faker.lorem.sentence(),
      timestamp: new Date().toISOString(),
    };
  }

  const addData = useCallback(() => {
    setMessages(messages.concat([randomMessage()]));
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(addData, 7 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [messages, setMessages]);

  return (
    <ChatWindowComponent
      currentUser={"alice"}
      messages={messages}
      onSend={async (content) => console.log("send", content)}
      conversationMetadata={{
        id: "foo",
        members: {
          alice: {
            id: "alice",
            profile: { username: "Alice!" },
          },
          bob: {
            id: "bob",
            profile: { username: "Bob!" },
          },
        },
        participants: [AddressFromString("alice.1")],
      }}
    />
  );
};
