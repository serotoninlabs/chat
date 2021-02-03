import { v4 as uuid } from "uuid";
import {
  ChatService,
  Conversation,
  ChatMessage,
  IncomingMessage,
  OutgoingMessage,
  Participant,
} from "./ChatService";

class Coordinator {
  private instances: DemoChatService[] = [];

  public register(instance: DemoChatService) {
    this.instances = this.instances.concat([instance]);
  }
  public async onSend(message: OutgoingMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const { type, ...rest } = message;
        this.instances.forEach((instance) => {
          const p = instance.getParticipant();
          if (message.sender.userId !== instance.getParticipant().userId) {
            const incoming: IncomingMessage = {
              type: "incoming",
              ...rest,
            };
            instance.onReceive(incoming);
          } else {
            instance.onReceive(message);
          }
        });
        resolve();
      }, 500);
    });
  }
}

const coordinator = new Coordinator();

export class DemoChatService extends ChatService {
  private userId: string;
  private deviceId: string;
  private conversations: { [key: string]: Conversation } = {};
  constructor(userId: string, deviceId: string) {
    super();
    this.userId = userId;
    this.deviceId = deviceId;
    coordinator.register(this);
  }

  public async onSend(message: OutgoingMessage): Promise<void> {
    await coordinator.onSend(message);
  }
  public async onReceive(message: ChatMessage): Promise<void> {
    const conversation = this.conversations[message.conversationId];
    if (!conversation) {
      throw new Error("unknown conversation");
    }
    conversation.receive(message);
  }
  public getParticipant(): Participant {
    return { userId: this.userId, deviceId: this.deviceId };
  }

  public async startConversation(
    conversationId: string
  ): Promise<Conversation> {
    const conversation = new DemoConversation(this, conversationId);
    this.conversations[conversationId] = conversation;
    return conversation;
  }
}

export class DemoConversation extends Conversation {
  private service: ChatService;
  private conversationId: string;
  constructor(service: ChatService, conversationId: string) {
    super();
    this.service = service;
    this.conversationId = conversationId;
  }
  public async send(content: string): Promise<OutgoingMessage> {
    const message: OutgoingMessage = {
      type: "outgoing",
      conversationId: this.conversationId,
      messageId: uuid(),
      sender: this.service.getParticipant(),
      content,
      timestamp: new Date().toISOString(),
    };
    await coordinator.onSend(message);
    return message;
  }
  public async receive(message: ChatMessage): Promise<void> {
    this.updateState({ messages: this.state.messages.concat([message]) });
  }
}
