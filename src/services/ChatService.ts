import { StatefulService } from "./StatefulService";
import { v4 as uuid } from "uuid";
import { SignalService } from "./SignalService";
import { RemoteService } from "./RemoteService";
import { ChatStorage } from "./ChatStorage";
import { SecureMessage } from "./SecureMessage";

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
  // protected conversations: { [key: string]: Conversation } = {};

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
      (sender: Address, message: SecureMessage) =>
        this.onDecryptedMessage(sender, message)
    );
  }
  public async send(conversationId: string, content: string) {
    const message: ChatMessage = {
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

    for (const recipient of participants) {
      if (recipient.toIdentifier() !== this.address.toIdentifier()) {
        const payload: SecureMessage = {
          type: "superduper.so/chat/message",
          payload: message,
        };
        const ciphertext = await this.signal.encrypt(recipient, payload);
        await this.remote.send(recipient, ciphertext);
      }
    }
    await this.storage.storeMessage(message);
  }

  public getAddress(): Address {
    return this.address;
  }

  public async onDecryptedMessage(
    sender: Address,
    message: SecureMessage
  ): Promise<void> {
    if (message.type !== "superduper.so/chat/message") {
      return;
    }
    await this.storage.storeMessage(message.payload);
    console.log("got a message", sender, message);
  }
}
