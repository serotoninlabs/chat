import { StatefulService } from "./StatefulService";
import { v4 as uuid } from "uuid";
import { Address, AddressToString, SignalService } from "./SignalService";
import { RemoteService } from "./RemoteService";
import { ChatStorage } from "./ChatStorage";
import { SecureMessage } from "./SecureMessage";

export interface ChatState {}

export interface ConversationMetadata {
  id: string;
  members: {
    [id: string]: {
      id: string;
      profile: {
        username: string;
        avatar?: string | null | undefined;
      };
    };
  };
  participants: Address[];
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
  // protected conversations: { [key: string]: Conversation } = {};

  public static async build(
    signal: SignalService,
    remote: RemoteService,
    userId: string,
    storagePrefix?: string
  ): Promise<ChatService> {
    const storage = new ChatStorage();
    await storage.initialize(
      storagePrefix ? `${userId}/${storagePrefix}` : userId
    );
    const service = new ChatService(storage, signal, remote);
    await service.initialize();
    return service;
  }

  constructor(
    storage: ChatStorage,
    signal: SignalService,
    remote: RemoteService
  ) {
    super({ messages: [] });
    this.storage = storage;
    this.signal = signal;
    this.remote = remote;
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
      sender: this.signal.getAddressString(),
      content,
      timestamp: new Date().toISOString(),
    };

    const conversation = await this.remote.getConversationMetadata(
      conversationId
    );

    for (const recipient of conversation.participants) {
      if (AddressToString(recipient) !== this.signal.getAddressString()) {
        const payload: SecureMessage = {
          type: "superduper.so/chat/message",
          payload: message,
        };
        const ciphertext = await this.signal.encrypt(recipient, payload);
        await this.remote.send(this.signal.getAddress(), recipient, ciphertext);
      }
    }
    await this.storage.storeMessage(message);
  }

  public async onDecryptedMessage(
    sender: Address,
    message: SecureMessage
  ): Promise<void> {
    console.log("onDecryptedMessage", sender, message);
    if (message.type !== "superduper.so/chat/message") {
      return;
    }
    await this.storage.storeMessage(message.payload);
    console.log("got a message", sender, message);
  }
}
