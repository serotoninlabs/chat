import { SignalService } from "./SignalService";
import {
  ChatService,
  Conversation,
  ChatMessage,
  IncomingMessage,
  OutgoingMessage,
  Address,
} from "./ChatService";
import { StorageService } from "./StorageService";
import { DemoRemoteService } from "./DemoRemoteService";
import { RemoteService } from "./RemoteService";
import { EncryptedMessage } from "../types";

type CoordinatorServices = {
  [key: string]: ChatService;
};
class Coordinator {
  private services: CoordinatorServices = {};
  private addresses: Address[] = [];

  constructor() {}

  public async register(chat: ChatService) {
    const address = chat.getAddress();

    this.services[address.toIdentifier()] = chat;
    this.addresses = this.addresses.concat([address]);
  }

  public async onSend(
    coversationId: string,
    sender: Address,
    recipient: Address,
    message: EncryptedMessage
  ): Promise<void> {
    const chatService = this.services[recipient.toIdentifier()];
    chatService.onReceive(coversationId, sender, message);
  }
}

const coordinator = new Coordinator();

export class DemoChatService extends ChatService {
  static async build(userId: string, deviceId: string) {
    const address = new Address(userId, deviceId);
    const storage = await StorageService.build(address);
    const remote = await DemoRemoteService.build(address);
    const signal = await SignalService.build(storage, remote, address);
    const service = new DemoChatService(signal, remote, storage, address);
    await coordinator.register(service);

    return service;
  }

  public async send(
    conversationId: string,
    recipient: Address,
    message: EncryptedMessage
  ) {
    await coordinator.onSend(conversationId, this.address, recipient, message);
  }
  public async onReceive(
    conversationId: string,
    sender: Address,
    message: EncryptedMessage
  ): Promise<void> {
    const conversation = this.conversations[conversationId];
    if (!conversation) {
      console.log("eek!");
      throw new Error("unknown conversation");
    }
    conversation.receive(sender, message);
  }
  public getAddress(): Address {
    return this.address;
  }
}
