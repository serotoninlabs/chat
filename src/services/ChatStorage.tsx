import { IDBPDatabase, DBSchema } from "idb";
import { ChatMessage } from "./ChatService";
import { StorageFactory } from "./StorageFactory";

export interface MessageWrapper {
  date: Date;
  message: ChatMessage;
}

export interface ChatStorageSchema extends DBSchema {
  messages: {
    key: string;
    value: MessageWrapper;
    indexes: { conversation: string; date: [string, Date] };
  };
}

export class ChatStorage extends StorageFactory<ChatStorageSchema> {
  public version = 1;
  public namespace = "superduper.so";
  public databaseName = "chat";
  public migrations = {
    1(db: IDBPDatabase<ChatStorageSchema>) {
      const messages = db.createObjectStore("messages");
      messages.createIndex("conversation", "message.conversationId");
      messages.createIndex("date", ["message.conversationId", "date"]);
    },
  };

  public async getAllFromConversation(
    conversationId: string
  ): Promise<MessageWrapper[]> {
    const idx = IDBKeyRange.bound(
      [conversationId, new Date(0)],
      [conversationId, new Date()]
    );
    return this.db.getAllFromIndex("messages", "date", idx);
  }

  public async storeMessage(message: ChatMessage): Promise<void> {
    const wrapped = {
      date: new Date(message.timestamp),
      message,
    };
    return this.store("messages", message.messageId, wrapped);
  }

  public subscribeToConversation(
    conversationId: string,
    cb: (message: MessageWrapper) => void
  ): string {
    return this.subscribeToStore(
      "messages",
      (_, value) => value.message.conversationId === conversationId,
      (_, value) => cb(value)
    );
  }
  public unsubscribeFromCoversation(subscriptionId: string) {
    this.unsubscribeFromStore("messages", subscriptionId);
  }
}
