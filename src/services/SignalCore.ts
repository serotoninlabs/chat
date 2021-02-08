import { KeyPair, SignalLibrary } from "../types";

import { serializeKey } from "../utils";
import { Address } from "./SignalService";
import { SignalStorage } from "./SignalStorage";

export interface SignalStorageInterface {
  getIdentityKeyPair(): Promise<KeyPair>;
  getLocalRegistrationId(): Promise<number | undefined>;
  isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    direction: any
  ): Promise<boolean>;
  loadIdentityKey(identifier: string): Promise<ArrayBuffer | undefined>;
  loadPreKey(keyId: number): Promise<KeyPair | undefined>;
  loadSession(identifier: string): Promise<string | undefined>;
  removePreKey(keyId: number): Promise<void>;
  removeSession(identifier: string): Promise<void>;
  removeAllSessions(identifier: string): Promise<void>;
  saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean>;
}

export class SignalCore implements SignalStorageInterface {
  private storage: SignalStorage;
  private lib: SignalLibrary;

  public Direction = {
    SENDING: 1,
    RECEIVING: 2,
  };

  constructor(lib: SignalLibrary, storage: SignalStorage, address: Address) {
    this.lib = lib;
    this.storage = storage;
  }

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

    const result = await this.storage.saveIdentity(identifier, identityKey);
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

  // fetches the public key from the key server
  public async loadIdentityKey(
    identifier: string
  ): Promise<ArrayBuffer | undefined> {
    return this.storage.loadIdentityKey(identifier);
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

  public async removePreKey(keyId: number): Promise<void> {
    await this.storage.removePreKey(keyId);
  }

  /* Returns a signed keypair object or undefined */
  public async loadSignedPreKey(keyId: number): Promise<KeyPair | undefined> {
    return this.storage.loadSignedPreKey(keyId);
  }

  public async removeSignedPreKey(keyId: number) {
    await this.storage.removeSignedPreKey(keyId);
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
  public async removeSession(identifier: string): Promise<void> {
    return this.storage.removeSession(identifier);
  }
  public async removeAllSessions(identifier: string): Promise<void> {
    return this.storage.removeSession(identifier);
  }

  public async getLocalRegistrationId(): Promise<number | undefined> {
    return this.storage.getRegistrationId();
  }
}
