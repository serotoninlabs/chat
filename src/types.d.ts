declare module "libsignal-protocol";
declare module "libsignal-protocol/dist/libsignal-protocol";

export type KeyPair = { privKey: ArrayBuffer; pubKey: ArrayBuffer };
export type PreKey = { keyId: number; keyPair: KeyPair };
export type SignedPreKey = PreKey & { signature: ArrayBuffer };

export type SerializedKeyPair = { privKey: string; pubKey: string };
export type SerializedPreKey = { keyId: number; keyPair: SerializedKeyPair };
export type SerializedSignedPreKey = SerializedPreKey & { signature: string };

export interface SignalProtocolAddress {
  new (name: string, deviceId: string | number);
  getName(): string;
  getDeviceId(): string | number;
  toString(): string;
  equals(address: SignalProtocolAddress): boolean;
  fromString(encodedAddress: string): SignalProtocolAddress;
}
export interface KeyHelper {
  generateIdentityKeyPair(): Promise<KeyPair>;
  generateRegistrationId(): number;
  generateSignedPreKey(
    identityKeyPair: KeyPair,
    signedKeyId: number
  ): Promise<SignedPreKey>;
  generatePreKey(keyId: number): Promise<PreKey>;
}
export interface SerializedPreKeyBundle {
  registrationId: number;
  identityKey: string;
  signedPreKey: {
    keyId: number;
    pubKey: string;
    signature: string;
  };
  preKey: {
    keyId: number;
    pubKey: string;
  };
}
export interface PreKeyBundle {
  address: {
    userId: string;
    deviceId: string;
  };
  registrationId: number;
  identityKey: ArrayBuffer;
  signedPreKey: {
    keyId: number;
    publicKey: ArrayBuffer;
    signature: ArrayBuffer;
  };
  preKey: {
    keyId: number;
    publicKey: ArrayBuffer;
  };
}
export type EncryptedMessage = {
  type: number;
  body: string;
  registrationId: number;
};
export interface SessionBuilder {
  new (store: any, address: SignalProtocolAddress): SessionBuilder;
  processPreKey(device: PreKeyBundle): Promise<void>;
}
export interface SessionCipher {
  new (store: any, address: SignalProtocolAddress): SessionCipher;
  encrypt(
    plaintext: string | ArrayBuffer,
    encoding?: "base64" | "hex" | "binary" | "utf8"
  ): Promise<EncryptedMessage>;
  decryptPreKeyWhisperMessage(
    buffer: string | ArrayBuffer,
    encoding?: "base64" | "hex" | "binary" | "utf8"
  ): Promise<ArrayBuffer>;
  decryptWhisperMessage(
    buffer: string | ArrayBuffer,
    encoding?: "base64" | "hex" | "binary" | "utf8"
  ): Promise<ArrayBuffer>;
}
export interface SessionRecord {}
export interface SignalLibrary {
  KeyHelper: KeyHelper;
  SignalProtocolAddress: SignalProtocolAddress;
  SessionBuilder: SessionBuilder;
  SessionCipher: SessionCipher;
  SessionRecord: SessionRecord;
}
