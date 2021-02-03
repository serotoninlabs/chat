import { StatefulService } from "./StatefulService";
import { v4 as uuid } from "uuid";
import ByteBuffer from "bytebuffer";
import { EncryptedSession, SignalService } from "./SignalService";
import { RemoteService } from "./RemoteService";
import { StorageService } from "./StorageService";
import { EncryptedMessage } from "../types";

export interface ChatState {}

export class Address {
  public userId: string;
  public deviceId: string;
  static fromString(input: string): Address {
    const [userId, deviceId] = input.split(".");
    return new Address(userId, deviceId);
  }
  constructor(userId: string, deviceId: string) {
    this.userId = userId;
    this.deviceId = deviceId;
  }

  public toIdentifier() {
    return `${this.userId}.${this.deviceId}`;
  }
  public toString() {
    return this.toIdentifier();
  }
}

export type ChatMessage = {
  conversationId: string;
  messageId: string;
  sender: string;
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
  public signal: SignalService;
  public remote: RemoteService;
  public storage: StorageService;
  public address: Address;
  protected conversations: { [key: string]: Conversation } = {};

  constructor(
    signal: SignalService,
    remote: RemoteService,
    storage: StorageService,
    address: Address
  ) {
    super({ messages: [] });
    this.signal = signal;
    this.remote = remote;
    this.storage = storage;
    this.address = address;
  }
  abstract send(
    conversationId: string,
    recipient: Address,
    message: EncryptedMessage
  ): Promise<void>;
  abstract onReceive(
    conversationId: string,
    sender: Address,
    message: EncryptedMessage
  ): Promise<void>;
  abstract getAddress(): Address;
  public async startConversation(
    conversationId: string
  ): Promise<Conversation> {
    console.log(
      "starting conversation: ",
      conversationId,
      this.address.toIdentifier()
    );
    const conversation = new Conversation(this, conversationId);
    await conversation.initialize();
    this.conversations[conversationId] = conversation;
    console.log("done", this.address.toIdentifier());
    return conversation;
  }
}

export interface ConversationState {
  messages: any[];
}
export class Conversation extends StatefulService<ConversationState> {
  private service: ChatService;
  private conversationId: string;
  private sessions!: EncryptedSession[];

  constructor(service: ChatService, conversationId: string) {
    super({ messages: [] });
    this.service = service;
    this.conversationId = conversationId;
  }
  public async initialize(): Promise<void> {
    this.sessions = await this.service.signal.startSession(this.conversationId);
  }
  public async send(content: string): Promise<void> {
    const message: OutgoingMessage = {
      type: "outgoing",
      conversationId: this.conversationId,
      messageId: uuid(),
      sender: this.service.getAddress().toIdentifier(),
      content,
      timestamp: new Date().toISOString(),
    };

    const jsonMessage = JSON.stringify(message);
    const ab = ByteBuffer.wrap(jsonMessage, "binary").toArrayBuffer();

    for (const session of this.sessions) {
      const ciphertext = await session.cipher.encrypt(ab);
      await this.service.send(this.conversationId, session.address, ciphertext);
    }
    this.updateState({ messages: this.state.messages.concat([message]) });
  }
  public async receive(
    sender: Address,
    ciphertext: EncryptedMessage
  ): Promise<void> {
    const plaintext = await this.service.signal.decrypt(sender, ciphertext);
    const message = JSON.parse(plaintext);

    this.updateState({ messages: this.state.messages.concat([message]) });
    //this.updateState({ messages: this.state.messages.concat([message]) });
  }
}
