import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button } from "@serotonin/components";
import { ChatMessage, ConversationMetadata } from "../services/ChatService";

import { MessageContainer, ChatMessageProps } from "./MessageContainer";
import { MessageInput } from "./MessageInput";

const MessagesContainer = styled.div``;

const WindowContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 280px;
  ${MessagesContainer} {
    flex-grow: 1;
  }
`;

const NewMessages = styled(Button)<{ visible: boolean }>`
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  background-color: rgb(0, 0, 0, 0.75);
  color: white;
  text-align: center;
  position: relative;
  top: 400px;
  width: 100%;
`;

const MessagesViewport = styled.div`
  min-height: 400px;
  max-height: 400px;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    background: white;
  }

  ::-webkit-scrollbar-thumb {
    background: #ccc;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
`;

export interface ChatWindowProps {
  topElement?: React.ReactElement;
  currentUser: string;
  conversationMetadata?: ConversationMetadata;
  messages: ChatMessage[];
  messageComponent?: React.FC<ChatMessageProps>;
  onSend(content: string): Promise<void>;
}
export const ChatWindow: React.FC<ChatWindowProps> = ({
  topElement,
  conversationMetadata,
  currentUser,
  messages,
  messageComponent,
  onSend,
}) => {
  return (
    <WindowContainer>
      <Messsages
        currentUser={currentUser}
        conversationMetadata={conversationMetadata}
        messages={messages}
        messageComponent={messageComponent}
      ></Messsages>
      <MessageInput onSend={onSend} />
    </WindowContainer>
  );
};

const Messsages: React.FC<{
  currentUser: string;
  conversationMetadata?: ConversationMetadata;
  messageComponent?: React.FC<ChatMessageProps>;
  messages: ChatMessage[];
}> = ({ currentUser, conversationMetadata, messages, messageComponent }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showNewButton, setShowNewButton] = useState(false);
  const scrollToBottom = useCallback(() => {
    if (divRef && divRef.current) {
      divRef.current.scrollTo(0, divRef.current.scrollHeight);
      if (showNewButton) {
        setShowNewButton(false);
      }
    }
  }, [divRef]);

  const onScroll = useCallback((e) => {
    const elem = e.target;

    // at the bottom
    if (elem.scrollHeight - elem.scrollTop == elem.clientHeight) {
      setShowNewButton(false);
      setHasScrolled(false);
    } else {
      // not at the bottom
      setHasScrolled(true);
    }
  }, []);

  useEffect(() => {
    let listener: any;
    if (divRef && divRef.current) {
      listener = divRef.current.addEventListener("scroll", onScroll);
    }
    scrollToBottom();
    return () => {
      if (divRef.current) {
        divRef.current?.removeEventListener("scroll", listener);
      }
    };
  }, [divRef]);

  useEffect(() => {
    if (divRef && divRef.current) {
      const elem = divRef.current;
      const scrollHeight = elem.scrollHeight;

      if (elem.scrollHeight - elem.scrollTop == elem.clientHeight) {
        if (showNewButton === true) {
          setShowNewButton(false);
        }
      } else if (showNewButton === false) {
        setShowNewButton(true);
      }
      if (!hasScrolled) {
        scrollToBottom();
      }
    }
  }, [messages]);
  return (
    <MessagesContainer>
      <NewMessages onClick={scrollToBottom} visible={showNewButton}>
        New Messages
      </NewMessages>
      <MessagesViewport ref={divRef}>
        {messages.map((message) => {
          const Component = messageComponent
            ? messageComponent
            : MessageContainer;
          return (
            <Component
              key={message.messageId}
              currentUser={currentUser}
              conversationMetadata={conversationMetadata}
              message={message}
            />
          );
        })}
      </MessagesViewport>
    </MessagesContainer>
  );
};
