import { SmallText } from "@serotonin/components/dist/module";
import React from "react";
import styled, { DefaultTheme } from "styled-components";
import { ChatMessage } from "../services/ChatService";

type ChatMessageTypes = "incoming" | "outgoing" | "event";

const TypeStyles = (
  props: DefaultTheme
): {
  [type in ChatMessageTypes]: any;
} => ({
  incoming: {
    fontFamily: props.fonts.sansSerif,
    borderRadius: "6px",
    padding: "8px",
    margin: "8px 45px 8px 8px",
    // backgroundColor: "#EFEEF2",
    backgroundColor: props.colors.secondary.main,
    textAlign: "left",
  },
  outgoing: {
    fontFamily: props.fonts.sansSerif,
    borderRadius: "6px",
    padding: "8px",
    margin: "8px 8px 8px 45px",
    backgroundColor: "#F6E6E7",
    textAlign: "right",
  },
  event: {
    fontFamily: props.fonts.sansSerif,
    fontSize: "smaller",
    color: "#aaa",
    padding: "8px",
    margin: "8px 18px 8px 18px",
    backgroundColor: "white",
    textAlign: "center",
  },
});

const StyledMessageContainer = styled.div<{ type: ChatMessageTypes }>(
  (props) => TypeStyles(props.theme)[props.type]
);

export interface ChatMessageProps {
  currentUser: string;
  message: ChatMessage;
}

export const MessageContainer: React.FC<ChatMessageProps> = ({
  currentUser,
  message,
}) => {
  const senderUser = message.sender.split(".")[0];
  const type: ChatMessageTypes =
    senderUser === currentUser ? "outgoing" : "incoming";

  return (
    <StyledMessageContainer type={type}>
      <div>
        <SmallText>{senderUser}</SmallText>
      </div>
      <div>{message.content}</div>
    </StyledMessageContainer>
  );
};
