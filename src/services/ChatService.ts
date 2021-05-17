import { StatefulService } from "./StatefulService";
import { v4 as uuid } from "uuid";
import { Address, AddressToString, SignalService } from "./SignalService";
import { RemoteService } from "./RemoteService";
import { ChatStorage } from "./ChatStorage";
import { SecureInvitation, SecureMessage } from "./SecureMessage";
import { EncryptedMessage } from "../types";

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
  admins: Address[];
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
          type: "kismet.so/chat/message",
          payload: message,
        };
        const ciphertext = await this.signal.encrypt(recipient, payload);
        await this.remote.send(this.signal.getAddress(), recipient, ciphertext);
      }
    }
    await this.storage.storeMessage(message);
  }

  public async invite(
    userId: string,
    subject: string,
    message: string,
    tags: string[]
  ) {
    const request: SecureInvitation = {
      type: "kismet.so/chat/join-request",
      payload: {
        messageId: uuid(),
        sender: this.signal.getAddressString(),
        subject,
        message,
        timestamp: new Date().toISOString(),
        meta: { tags },
      },
    };

    const addresses = await this.remote.getUserAddresses(userId);

    let requests: Array<{
      recipient: Address;
      ciphertext: EncryptedMessage;
    }> = [];
    for (const recipientGraphql of addresses) {
      if (
        AddressToString(recipientGraphql) !== this.signal.getAddressString()
      ) {
        const ciphertext = await this.signal.encrypt(recipientGraphql, request);
        // this object has __typename that comes along with it, which blows up the graphql validation
        // explicitly build the object to get around that
        const recipient = {
          userId: recipientGraphql.userId,
          deviceId: recipientGraphql.deviceId,
        };
        requests.push({ recipient, ciphertext });
      }
    }
    await this.remote.invite(this.signal.getAddress(), requests, tags);
  }

  public async decrypt(
    sender: Address,
    ciphertext: EncryptedMessage
  ): Promise<SecureMessage> {
    return this.signal.decrypt(sender, ciphertext);
  }

  public async onDecryptedMessage(
    sender: Address,
    message: SecureMessage
  ): Promise<void> {
    console.log("onDecryptedMessage", sender, message);
    if (message.type !== "kismet.so/chat/message") {
      console.log("got a message not of type /chat/message - not storing");
      return;
    }
    await this.storage.storeMessage(message.payload);
    console.log("got a message", sender, message);
  }
}
