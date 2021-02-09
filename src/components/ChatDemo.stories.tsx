import { Meta } from "@storybook/react";
import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";

import { ChatManager } from "./ChatManager";
import { ManagedChatWindow } from "./ManagedChatWindow";
import { DemoChatService } from "../services/DemoChatService";
import { ChatService } from "../services/ChatService";

export default {
  title: "Chat/Demo",
} as Meta;

const Panel = styled.div``;
const Container = styled.div`
  display: flex;
  flex-direction: row;
  ${Panel} {
    width: 280px;
    margin: 0 30px;
    height: 600px;
    > *:nth-child(2) {
      border: 1px solid #e5e5e5;
    }
  }
`;

type devices = "alice1" | "bob1" | "carol1" | "alice2";
type Services = { [key in devices]: ChatService };
export const Demo = () => {
  const [initialized, setInitialized] = useState(false);
  const [services, setServices] = useState<Services>();

  useEffect(() => {
    async function init() {
      setServices({
        alice1: await DemoChatService.build("alice", "1"),
        bob1: await DemoChatService.build("bob", "1"),
        carol1: await DemoChatService.build("carol", "1"),
        alice2: await DemoChatService.build("alice", "2"),
      });
      setInitialized(true);
    }
    init();
  }, []);

  if (!initialized) {
    return <div>loading...</div>;
  }

  return (
    <Container>
      <Panel>
        <h1>Alice!</h1>
        <ChatManager service={services.alice1}>
          <ManagedChatWindow conversationId="demo" />
        </ChatManager>
      </Panel>
      <Panel>
        <h1>Bob</h1>
        <ChatManager service={services.bob1}>
          <ManagedChatWindow conversationId="demo" />
        </ChatManager>
      </Panel>
      <Panel>
        <h1>Carol</h1>
        <ChatManager service={services.carol1}>
          <ManagedChatWindow conversationId="demo" />
        </ChatManager>
      </Panel>
      <Panel>
        <h1>Alice - Mobile</h1>
        <ChatManager service={services.alice2}>
          <ManagedChatWindow conversationId="demo" />
        </ChatManager>
      </Panel>
    </Container>
  );
};
