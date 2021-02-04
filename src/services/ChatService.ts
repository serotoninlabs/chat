import { StatefulService } from "./StatefulService";
import { v4 as uuid } from "uuid";
import ByteBuffer from "bytebuffer";
import { EncryptedSession, SignalService, SignalState } from "./SignalService";
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
  public async initialize() {
    this.signal.decryptedMessageSubscribe(
      (sender: Address, plaintext: string) =>
        this.onDecryptedMessage(sender, plaintext)
    );
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
    const conversation = new Conversation(this, conversationId);
    await conversation.initialize();
    this.conversations[conversationId] = conversation;
    return conversation;
  }

  public async onDecryptedMessage(
    sender: Address,
    plaintext: string
  ): Promise<void> {
    const message = JSON.parse(plaintext) as ChatMessage;
    const conversation = this.conversations[message.conversationId];
    conversation.receive(message);
    console.log("got a message", sender, plaintext, conversation);
  }
}

export interface ConversationState {
  messages: any[];
}
export class Conversation extends StatefulService<ConversationState> {
  private service: ChatService;
  private conversationId: string;
  private participants!: Address[];

  constructor(service: ChatService, conversationId: string) {
    super({ messages: [] });
    this.service = service;
    this.conversationId = conversationId;
  }
  public async initialize(): Promise<void> {
    this.participants = await this.service.remote.getConversationParticipants(
      this.conversationId
    );
    console.log(
      "conversation initialized: ",
      this.conversationId,
      this.participants
    );
    // this.sessions = await this.service.signal.startSession(this.conversationId);
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
    for (const recipient of this.participants) {
      if (recipient.toIdentifier() !== this.service.address.toIdentifier()) {
        const ciphertext = await this.service.signal.encrypt(
          recipient,
          jsonMessage
        );
        await this.service.send(this.conversationId, recipient, ciphertext);
      }
    }
    this.updateState({ messages: this.state.messages.concat([message]) });
  }
  public async receive(message: ChatMessage): Promise<void> {
    this.updateState({ messages: this.state.messages.concat([message]) });
    //this.updateState({ messages: this.state.messages.concat([message]) });
  }
}
