import { EncryptedMessage, KeyPair, PreKey, PreKeyBundle } from "../types";
import { ConversationMetadata } from "./ChatService";
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
  getConversationMetadata(
    conversationId: string
  ): Promise<ConversationMetadata>;
  registerDevice(
    registration: RemoteDeviceRegistration
  ): Promise<RegistrationResult>;

  send(
    sender: Address,
    recipient: Address,
    message: EncryptedMessage
  ): Promise<void>;
  getUserAddresses(userId: string): Promise<Address[]>;
  // joinRequest(
  //   sender: Address,
  //   conversationId: string,
  //   invitations: Array<{
  //     recipient: Address;
  //     ciphertext: EncryptedMessage;
  //   }>
  // ): Promise<void>;
  invite(
    sender: Address,
    invitations: Array<{
      recipient: Address;
      ciphertext: EncryptedMessage;
    }>,
    tags: string[]
  ): Promise<void>;
  invitationResponse(
    sender: Address,
    senderUserId: string,
    accept: boolean
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
