import { EncryptedMessage, PreKey, PreKeyBundle } from "../types";
import { Address } from "./ChatService";

export interface RemoteService {
  send(recipient: Address, message: EncryptedMessage): Promise<void>;
  subscribe(
    onMessage: (sender: Address, message: EncryptedMessage) => Promise<void>
  ): void;
  unsubscribe(
    onMessage: (sender: Address, message: EncryptedMessage) => Promise<void>
  ): void;
  getConversationParticipants(conversationId: string): Promise<Address[]>;
  generatePreKeyBundle(addresses: Address): Promise<PreKeyBundle>;
  saveIdentity(identifier: string, identityKey: string): Promise<void>;
  // removeAllSessions(identifier: string): Promise<void>;
  loadIdentityKey(identifier: string): Promise<undefined | ArrayBuffer>;
  storePreKeys(publicPreKeys: PreKey[]): Promise<void>;
  removePreKey(keyId: number): Promise<void>;
  storeSignedPreKey(
    keyId: number,
    pubKey: ArrayBuffer,
    signature: ArrayBuffer
  ): Promise<void>;
}
