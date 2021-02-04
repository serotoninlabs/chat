import { SmallText } from "@serotonin/components/dist/module";
import React from "react";
import styled from "styled-components";
import { ChatMessage } from "./services/ChatService";

type ChatMessageTypes = "incoming" | "outgoing" | "event";

type TypeStyle = {
  backgroundColor: string;
};
const TypeStyles: {
  [type in ChatMessageTypes]: any;
} = {
  incoming: {
    borderRadius: "6px",
    padding: "8px",
    margin: "8px 45px 8px 8px",
    backgroundColor: "#EFEEF2",
    textAlign: "left",
  },
  outgoing: {
    borderRadius: "6px",
    padding: "8px",
    margin: "8px 8px 8px 45px",
    backgroundColor: "#F6E6E7",
    textAlign: "right",
  },
  event: {
    fontSize: "smaller",
    color: "#aaa",
    padding: "8px",
    margin: "8px 18px 8px 18px",
    backgroundColor: "white",
    textAlign: "center",
  },
};

const MessageContainer = styled.div<{ type: ChatMessageTypes }>(
  (props) => TypeStyles[props.type]
);

export const Message: React.FC<{
  currentUser: string;
  message: ChatMessage;
}> = ({ currentUser, message }) => {
  const senderUser = message.sender.split(".")[0];
  const type: ChatMessageTypes =
    senderUser === currentUser ? "outgoing" : "incoming";

  return (
    <MessageContainer type={type}>
      <div>
        <SmallText>{senderUser}</SmallText>
      </div>
      <div>{message.content}</div>
    </MessageContainer>
  );
};
