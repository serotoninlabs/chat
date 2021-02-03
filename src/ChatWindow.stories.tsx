import { Meta } from "@storybook/react";
import { useCallback, useEffect, useState } from "react";
import faker from "faker";
import {
  ChatWindow as ChatWindowComponent,
  PlaintextMessage,
  MessageTypes,
} from "./ChatWindow";
export default {
  title: "Chat/Window",
  component: ChatWindowComponent,
} as Meta;

const types: MessageTypes[] = ["inbound", "outbound", "event"];

export const ChatWindow = () => {
  const [messages, setMessages] = useState<PlaintextMessage[]>([
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
  function randomMessage(): PlaintextMessage {
    return {
      type: types[faker.random.number(2)],
      id: faker.random.uuid(),
      content: faker.lorem.sentence(),
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

  return <ChatWindowComponent messages={messages} onSend={console.log} />;
};
