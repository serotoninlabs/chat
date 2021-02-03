import { PreKey, PreKeyBundle } from "../types";
import { Address } from "./ChatService";

export interface RemoteService {
  generatePreKeyBundle(
    conversationId: string
  ): Promise<{ address: Address; bundle: PreKeyBundle }[]>;
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
