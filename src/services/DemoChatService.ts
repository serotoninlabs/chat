import { SignalService } from "./SignalService";
import {
  ChatService,
  Conversation,
  ChatMessage,
  IncomingMessage,
  OutgoingMessage,
  Address,
} from "./ChatService";
import { DemoRemoteService } from "./DemoRemoteService";
import { RemoteService } from "./RemoteService";
import { EncryptedMessage } from "../types";

// type CoordinatorServices = {
//   [key: string]: ChatService;
// };
// class Coordinator {
//   private services: CoordinatorServices = {};
//   private addresses: Address[] = [];

//   constructor() {}

//   public async register(chat: ChatService) {
//     const address = chat.getAddress();

//     this.services[address.toIdentifier()] = chat;
//     this.addresses = this.addresses.concat([address]);
//   }

//   public async onSend(
//     coversationId: string,
//     sender: Address,
//     recipient: Address,
//     message: EncryptedMessage
//   ): Promise<void> {
//     const chatService = this.services[recipient.toIdentifier()];
//     chatService.onReceive(coversationId, sender, message);
//   }
// }

// const coordinator = new Coordinator();

export class DemoChatService {
  static async build(userId: string, deviceId: string): Promise<ChatService> {
    const address = new Address(userId, deviceId);
    const remote = await DemoRemoteService.build(address);
    const signal = await SignalService.build(remote, address);
    const service = await ChatService.build(signal, remote, address);

    return service;
  }
}
