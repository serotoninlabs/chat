import { Address } from "./ChatService";
import { StatefulService } from "./StatefulService";
import { StorageService } from "./StorageService";
import { RemoteService } from "./RemoteService";
import ByteBuffer from "bytebuffer";

import {
  EncryptedMessage,
  KeyPair,
  PreKey,
  PreKeyBundle,
  SerializedKeyPair,
  SerializedPreKeyBundle,
  SessionCipher,
  SignalLibrary,
} from "../types";

import {
  deserializeKey,
  deserializeKeyPair,
  serializeKey,
  serializeKeyPair,
} from "../utils";
import { ethers } from "ethers";

export type EncryptedSession = {
  address: Address;
  cipher: SessionCipher;
};

export type SignalState =
  | {
      initialized: true;
      registrationId?: number;
      identityKeypair: KeyPair;
    }
  | { initialized: false };

export class SignalService extends StatefulService<SignalState> {
  private storage: StorageService;
  private remote: RemoteService;
  private address: Address;
  private lib!: SignalLibrary;

  public Direction = {
    SENDING: 1,
    RECEIVING: 2,
  };

  static async build(
    storage: StorageService,
    remote: RemoteService,
    address: Address
  ): Promise<SignalService> {
    const service = new SignalService(storage, remote, address);
    await service.initialize();
    return service;
  }

  constructor(
    storage: StorageService,
    remote: RemoteService,
    address: Address
  ) {
    super({ initialized: false });
    this.storage = storage;
    this.remote = remote;
    this.address = address;
  }

  public async initialize() {
    // @ts-ignore
    await import("libsignal-protocol/dist/libsignal-protocol");
    this.lib = (window as any).libsignal;

    let identityKeypair = await this.storage.getIdentityKeyPair();
    if (!identityKeypair) {
      identityKeypair = await this.createIdentity(false);
    }

    this.setState({ initialized: true, identityKeypair });
  }

  // this is not part of the signal.storage interface so we can change this
  public async startSession(
    conversationId: string
  ): Promise<EncryptedSession[]> {
    const preKeyBundles = await this.remote.generatePreKeyBundle(
      conversationId
    );

    // Instantiate a SessionBuilder for all of the user's devices
    let sessions: EncryptedSession[] = [];
    await Promise.all(
      preKeyBundles.map((result) => {
        const { address: remoteAddress, bundle } = result;

        const signalAddress = new this.lib.SignalProtocolAddress(
          remoteAddress.userId,
          remoteAddress.deviceId
        );
        const sessionBuilder = new this.lib.SessionBuilder(this, signalAddress);

        return sessionBuilder.processPreKey(bundle).then(() => {
          sessions = sessions.concat([
            {
              address: remoteAddress,
              cipher: new this.lib.SessionCipher(this, signalAddress),
            },
          ]);
        });
      })
    );
    return sessions;
  }

  public async decrypt(
    sender: Address,
    ciphertext: EncryptedMessage
  ): Promise<string> {
    const signalAddress = new this.lib.SignalProtocolAddress(
      sender.userId,
      sender.deviceId
    );
    const cipher = new this.lib.SessionCipher(this, signalAddress);

    // Decrypt a PreKeyWhisperMessage by first establishing a new session.
    // Returns a promise that resolves when the message is decrypted or
    // rejects if the identityKey differs from a previously seen identity for this
    // address.
    let plaintext: string;
    if (ciphertext.type === 3) {
      console.log(`${this.address.toIdentifier()} decryptPreKeyWhisperMessage`);
      const result = await cipher.decryptPreKeyWhisperMessage(
        ciphertext.body,
        "binary"
      );
      plaintext = ByteBuffer.wrap(result, "binary").toUTF8();
      // await this.sendMessage(senderId, deviceId, "ACK");
    } else {
      console.log(`${this.address.toIdentifier()} decryptWhisperMessage`);
      const result = await cipher.decryptWhisperMessage(
        ciphertext.body,
        "binary"
      );
      plaintext = ByteBuffer.wrap(result, "binary").toUTF8();
    }
    return plaintext;
  }

  // this is not part of the signal.storage interface so we can change this
  public async createIdentity(
    replaceExisting: boolean,
    numPreKeys: number = 20
  ): Promise<KeyPair> {
    const existingKeypair = await this.storage.getIdentityKeyPair();
    if (existingKeypair) {
      return existingKeypair;
    }
    const { KeyHelper } = this.lib;
    const identityKeys = await KeyHelper.generateIdentityKeyPair();
    await this.storage.storeIdentityKeyPair(identityKeys);

    await this.saveIdentity(this.address.toIdentifier(), identityKeys.pubKey);

    let promises = [];
    for (let i = 0; i < numPreKeys; i++) {
      promises[i] = KeyHelper.generatePreKey(i + 1);
    }
    const preKeys = await Promise.all(promises);
    await this.storePreKeys(preKeys);

    const signedPreKeyId = 0;
    const signedPreKey = await KeyHelper.generateSignedPreKey(
      identityKeys,
      signedPreKeyId
    );
    await this.storeSignedPreKey(
      signedPreKeyId,
      signedPreKey.keyPair,
      signedPreKey.signature
    );

    return identityKeys;
  }

  //// SIGNAL STORAGE INTERFACE, DO NOT CHANGE

  // required for libsignal storage
  // identifier should be name.deviceId
  public async saveIdentity(
    identifier: string,
    identityKey: ArrayBuffer
  ): Promise<boolean> {
    if (identifier === null || identifier === undefined)
      throw new Error("Tried to put identity key for undefined/null key");

    const address = this.lib.SignalProtocolAddress.fromString(identifier);
    const existing = await this.loadIdentityKey(address.getName());
    if (existing && serializeKey(identityKey) !== serializeKey(existing)) {
      return true;
    }

    const result = await this.remote.saveIdentity(
      identifier,
      serializeKey(identityKey)
    );
    return false;
  }

  public async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    direction: any
  ): Promise<boolean> {
    if (identifier === null || identifier === undefined) {
      throw new Error("tried to check identity key for undefined/null key");
    }
    if (!(identityKey instanceof ArrayBuffer)) {
      throw new Error("Expected identityKey to be an ArrayBuffer");
    }
    const trusted = await this.loadIdentityKey(identifier);
    if (trusted === undefined) {
      return true;
    }
    return serializeKey(identityKey) === serializeKey(trusted);
  }

  public async loadIdentityKey(
    identifier: string
  ): Promise<ArrayBuffer | undefined> {
    return this.remote.loadIdentityKey(identifier);
  }
  public async getIdentityKeyPair(): Promise<KeyPair> {
    const keys = await this.storage.getIdentityKeyPair();
    if (!keys) {
      throw new Error("no keys created");
    }
    return keys;
  }

  /* Returns a prekeypair object or undefined */
  public async loadPreKey(keyId: number): Promise<KeyPair | undefined> {
    return await this.storage.getPreKey(keyId);
  }

  public async storePreKeys(preKeys: PreKey[]): Promise<void> {
    let privatePreKeys: { [keyId: number]: SerializedKeyPair } = {};
    let publicPreKeys: PreKey[] = [];

    preKeys.forEach((preKey, i) => {
      privatePreKeys[preKey.keyId] = serializeKeyPair(preKey.keyPair);

      publicPreKeys[i] = preKey;
    });

    await this.remote.storePreKeys(publicPreKeys);
    await this.storage.storePrivatePreKeys(privatePreKeys);
  }
  public async removePreKey(keyId: number) {
    await this.remote.removePreKey(keyId);
    await this.storage.removePreKey(keyId);
  }

  /* Returns a signed keypair object or undefined */
  public async loadSignedPreKey(keyId: number): Promise<KeyPair | undefined> {
    return this.storage.loadSignedPreKey(keyId);
  }
  public async storeSignedPreKey(
    keyId: number,
    keyPair: KeyPair,
    signature: ArrayBuffer
  ) {
    await this.remote.storeSignedPreKey(keyId, keyPair.pubKey, signature);
    await this.storage.storeSignedPreKey(keyId, keyPair, signature);
  }
  public async removeSignedPreKey(keyId: number) {
    this.storage.removeSignedPreKey(keyId);
    // TODO(dankins)
    console.error("todo: remove signedprekey publickey from server");
  }

  public async loadSession(identifier: string): Promise<string | undefined> {
    return this.storage.getSession(identifier);
  }
  public async storeSession(
    identifier: string,
    record: string
  ): Promise<boolean> {
    await this.storage.storeSession(identifier, record);
    return true;
  }
  public async removeSession(identifier: string) {
    return this.storage.removeSession(identifier);
  }
  public async removeAllSessions(identifier: string) {
    return this.storage.removeSession(identifier);
  }

  public async getLocalRegistrationId(): Promise<number | undefined> {
    return SignalService.userIdToRegistrationId(this.address.userId);
  }

  static userIdToRegistrationId(userId: string): number {
    var hash = 0,
      i,
      chr;
    for (i = 0; i < this.length; i++) {
      chr = userId.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
    // const hashed = ethers.utils.sha256(ethers.utils.toUtf8Bytes(userId));
    // const bn = ethers.BigNumber.from(hashed).div(1e16);
    // console.log("userIdToRegistrationId", userId, bn.toNumber());
    // return bn.toNumber();
  }
}
