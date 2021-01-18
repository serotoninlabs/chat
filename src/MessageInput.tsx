import React, { useCallback, useRef } from "react";
import { useSignal } from "./ChatProvider";

export type MessageInputProps = {
  recipientUserId: string;
  onMessageSend?(plaintext: string): void;
};
export const MessageInput: React.FC<MessageInputProps> = ({
  recipientUserId,
  onMessageSend,
}) => {
  const { signal } = useSignal();
  const inputEl = useRef<HTMLInputElement>(null);

  const send = useCallback(() => {
    if (inputEl) {
      const message = inputEl.current!.value;
      console.log("ref", inputEl, message);
      signal.sendMessage(recipientUserId, 0, message).then(() => {
        console.log("message sent");
        inputEl.current!.value = "";
        if (onMessageSend) {
          onMessageSend(message);
        }
      });
    }
  }, [signal]);
  return (
    <div>
      <input type="text" ref={inputEl} />
      <button onClick={send}>Send</button>
    </div>
  );
};
