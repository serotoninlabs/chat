import { Meta } from "@storybook/react";
import styled from "styled-components";
import { useCallback, useEffect, useMemo, useState } from "react";
import faker from "faker";
import { ChatWindow as ChatWindowComponent } from "./ChatWindow";

import { ChatManager, ManagedChatWindow } from "./ChatManager";
import { DemoChatService } from "./services/DemoChatService";
import {
  ChatService,
  OutgoingMessage,
  IncomingMessage,
} from "./services/ChatService";

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
  const services = useMemo<Services>(
    () => ({
      alice1: new DemoChatService("alice", "1"),
      bob1: new DemoChatService("bob", "1"),
      carol1: new DemoChatService("carol", "1"),
      alice2: new DemoChatService("alice", "2"),
    }),
    []
  );

  return (
    <Container>
      <Panel>
        <h1>Alice</h1>
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
