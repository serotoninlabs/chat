import { ChatMessage } from "./ChatService";

export type SecureChatMessage = {
  type: "kismet.so/chat/message";
  payload: ChatMessage;
};

export type SecureMiscMessage = {
  type: "kismet.so/misc/any";
  payload: any;
};
export type SecureInvitation = {
  type: "kismet.so/chat/join-request";
  payload: {
    messageId: string;
    sender: string;
    timestamp: string;
    subject: string;
    message: string;
    meta?: any;
  };
};

export type SecureMessage =
  | SecureInvitation
  | SecureChatMessage
  | SecureMiscMessage;
