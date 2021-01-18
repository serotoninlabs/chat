declare module "libsignal-protocol";
declare module "libsignal-protocol/dist/libsignal-protocol";

export type KeyPair = { privKey: ArrayBuffer; pubKey: ArrayBuffer };
export type PreKey = { keyId: number; keyPair: KeyPair };
export type SignedPreKey = PreKey & { signature: ArrayBuffer };

export type SerializedKeyPair = { privKey: string; pubKey: string };
export type SerializedPreKey = { keyId: number; keyPair: SerializedKeyPair };
export type SerializedSignedPreKey = SerializedPreKey & { signature: string };

export interface SignalProtocolAddress {
  new (name: string, deviceId: number);
  getName(): string;
  getDeviceId(): number;
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
export interface SessionBuilder {
  new (store: any, address: SignalProtocolAddress);
  processPreKey(device: PreKeyBundle): Promise<void>;
}
export interface SessionCipher {
  new (store: any, address: SignalProtocolAddress);
  encrypt(
    plaintext: string | ArrayBuffer,
    encoding?: "base64" | "hex" | "binary" | "utf8"
  ): Promise<{ type: number; body: string; registrationId: string }>;
  decryptPreKeyWhisperMessage(ciphertext: {
    type: number;
    body: string;
  }): ArrayBuffer;
}
export interface SessionRecord {}
export interface SignalLibrary {
  KeyHelper: KeyHelper;
  SignalProtocolAddress: SignalProtocolAddress;
  SessionBuilder: SessionBuilder;
  SessionCipher: SessionCipher;
  SessionRecord: SessionRecord;
}
