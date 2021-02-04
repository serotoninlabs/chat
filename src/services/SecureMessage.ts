import { ChatMessage } from "./ChatService";

export type SecureChatMessage = {
  type: "superduper.so/chat/message";
  payload: ChatMessage;
};

export type SecureMiscMessage = {
  type: "superduper.so/misc/any";
  payload: any;
};

export type SecureMessage = SecureChatMessage;
