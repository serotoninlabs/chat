import React from "react";
import styled from "styled-components";

export interface ChatMessage {
  direction: "send" | "receive";
  plaintext: string;
}

export const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({
  message,
}) => {
  return (
    <div>
      {" "}
      {message.direction === "send" ? "<-" : "->"} {message.plaintext}
    </div>
  );
};
