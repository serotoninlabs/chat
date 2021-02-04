import { StatefulService } from "./StatefulService";
import { v4 as uuid } from "uuid";
import { SignalService } from "./SignalService";
import { RemoteService } from "./RemoteService";
import { EncryptedMessage } from "../types";
import { ChatStorage, MessageWrapper } from "./ChatStorage";

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

export class ChatService extends StatefulService<ChatState> {
  public storage: ChatStorage;
  public signal: SignalService;
  public remote: RemoteService;
  public address: Address;
  protected conversations: { [key: string]: Conversation } = {};

  public static async build(
    signal: SignalService,
    remote: RemoteService,
    address: Address
  ): Promise<ChatService> {
    const storage = new ChatStorage(address);
    await storage.initialize();
    const service = new ChatService(storage, signal, remote, address);
    await service.initialize();
    return service;
  }

  constructor(
    storage: ChatStorage,
    signal: SignalService,
    remote: RemoteService,
    address: Address
  ) {
    super({ messages: [] });
    this.storage = storage;
    this.signal = signal;
    this.remote = remote;
    this.address = address;
  }
  public async initialize() {
    this.signal.decryptedMessageSubscribe(
      (sender: Address, plaintext: string) =>
        this.onDecryptedMessage(sender, plaintext)
    );
  }
  public async send(conversationId: string, content: string) {
    const message: OutgoingMessage = {
      type: "outgoing",
      conversationId,
      messageId: uuid(),
      sender: this.getAddress().toIdentifier(),
      content,
      timestamp: new Date().toISOString(),
    };

    // todo(dankins): this is dumb and should be cached or something
    const participants = await this.remote.getConversationParticipants(
      conversationId
    );
    await this.storage.storeMessage(message);

    const jsonMessage = JSON.stringify(message);
    for (const recipient of participants) {
      if (recipient.toIdentifier() !== this.address.toIdentifier()) {
        const ciphertext = await this.signal.encrypt(recipient, jsonMessage);
        await this.remote.send(recipient, ciphertext);
      }
    }
  }

  public getAddress(): Address {
    return this.address;
  }
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
    await this.storage.storeMessage(message);
    console.log("got a message", sender, message);
  }
}

export interface ConversationState {
  messages: ChatMessage[];
}
export class Conversation extends StatefulService<ConversationState> {
  private service: ChatService;
  private conversationId: string;
  public participants!: Address[];
  private subscriptionId?: string;

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

    const initialMessages = await this.service.storage.getAllFromConversation(
      this.conversationId
    );
    const messages = initialMessages.map((m) => m.message);
    console.log("initial messages", messages);
    setImmediate(() =>
      this.updateState({
        messages: this.state.messages.concat(messages),
      })
    );
    this.subscriptionId = this.service.storage.subscribeToConversation(
      this.conversationId,
      (message) => this.onMessageReceived(message)
    );
  }
  public teardown(): void {
    if (this.subscriptionId) {
      this.service.storage.unsubscribeFromCoversation(this.subscriptionId!);
    }
  }
  public onMessageReceived(wrapper: MessageWrapper) {
    this.updateState({
      messages: this.state.messages.concat([wrapper.message]),
    });
  }
}
