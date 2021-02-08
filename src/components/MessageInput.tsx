import React, { useCallback, useRef, useState } from "react";
import {
  Row,
  TextInput,
  ActionButton,
  ForwardIcon,
} from "@serotonin/components";
import styled from "styled-components";

const MessageInputContainer = styled(Row)`
  border-top: 1px solid #e5e5e5;
  display: flex;
  flex-direction: row;
  > *:first-child {
    flex-grow: 1;
    height: 100%;
  }
  > *:nth-child(2) {
    margin: 8px;
  }
`;
const MessageInputComponent = styled(TextInput)`
  border: none;
  margin-top: 0px;
  > label {
    margin-bottom: 0px;
  }
  > input {
    border: none;
  }
`;

export const MessageInput: React.FC<{
  onSend(content: string): Promise<void>;
}> = ({ onSend }) => {
  const inputRef = useRef<HTMLInputElement>();
  const [saving, setSaving] = useState(false);
  const send = useCallback(async () => {
    setSaving(true);
    const content = inputRef.current!.value;
    await onSend(content);
    inputRef.current!.value = "";
    setSaving(false);
  }, [onSend, inputRef]);
  return (
    <MessageInputContainer>
      <MessageInputComponent
        name="message"
        placeholder="Type your message"
        inputRef={inputRef}
        disabled={saving}
      />
      <ActionButton icon={ForwardIcon} onClick={send} />
    </MessageInputContainer>
  );
};
