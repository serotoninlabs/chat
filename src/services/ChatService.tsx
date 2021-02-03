import { StatefulService } from "./StatefulService";

export interface ChatState {}

export type Participant = { userId: string; deviceId: string };

export type ChatMessageTypes = "incoming" | "outgoing" | "event";
export type ChatMessage = {
  type: ChatMessageTypes;
  conversationId: string;
  messageId: string;
  sender: Participant;
  timestamp: string;
  content: string;
  pending?: true;
};

export type OutgoingMessage = {
  type: "outgoing";
} & ChatMessage;

export type IncomingMessage = {
  type: "incoming";
} & ChatMessage;

export abstract class ChatService extends StatefulService<ChatState> {
  constructor() {
    super();
    this.state = { messages: [] };
  }
  abstract onSend(message: OutgoingMessage): Promise<void>;
  abstract onReceive(message: IncomingMessage): Promise<void>;
  abstract getParticipant(): Participant;
  abstract startConversation(conversationId: string): Promise<Conversation>;
}

export interface ConversationState {
  messages: any[];
}
export abstract class Conversation extends StatefulService<ConversationState> {
  constructor() {
    super();
    this.state = { messages: [] };
  }

  public abstract send(content: string): Promise<OutgoingMessage>;
  public abstract receive(message: ChatMessage): Promise<void>;
}
