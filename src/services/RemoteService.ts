import { EncryptedMessage, KeyPair, PreKey, PreKeyBundle } from "../types";
import { Address } from "./SignalService";

export interface RemoteDeviceRegistration {
  userId: string;
  identityPublicKey: ArrayBuffer;
  publicPreKeys: { keyId: number; pubKey: ArrayBuffer }[];
  signedPreKey: {
    keyId: number;
    pubKey: ArrayBuffer;
    signature: ArrayBuffer;
  };
}

export interface RegistrationResult {
  deviceId: string;
  registrationId: number;
}

export interface RemoteService {
  getConversationParticipants(conversationId: string): Promise<Address[]>;
  registerDevice(
    registration: RemoteDeviceRegistration
  ): Promise<RegistrationResult>;

  send(
    sender: Address,
    recipient: Address,
    message: EncryptedMessage
  ): Promise<void>;
  subscribe(
    subscriber: Address,
    onMessage: (
      receiptId: string,
      sender: Address,
      message: EncryptedMessage
    ) => Promise<void>
  ): void;
  unsubscribe(
    subscriber: Address,
    onMessage: (sender: Address, message: EncryptedMessage) => Promise<void>
  ): void;

  acknowledgeMessages(address: Address, messageIds: string[]): Promise<void>;

  generatePreKeyBundle(address: Address): Promise<PreKeyBundle>;
  // loadIdentityKey(identifier: string): Promise<undefined | ArrayBuffer>;

  // saveIdentity(
  //   currentAddress: Address,
  //   identityKey: ArrayBuffer
  // ): Promise<void>;
  // removePreKey(currentAddress: Address, keyId: number): Promise<void>;
  storePreKeys(address: Address, publicPreKeys: PreKey[]): Promise<void>;
  storeSignedPreKey(
    address: Address,
    keyId: number,
    pubKey: ArrayBuffer,
    signature: ArrayBuffer
  ): Promise<void>;
}
