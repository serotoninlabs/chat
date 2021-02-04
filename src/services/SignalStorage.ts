import { openDB, DBSchema, IDBPDatabase } from "idb";
import { KeyPair, SerializedKeyPair, SerializedSignedPreKey } from "../types";
import { deserializeKeyPair, serializeKey, serializeKeyPair } from "../utils";
import { Address } from "./ChatService";
import { StorageFactory } from "./StorageFactory";

interface StorageSchema extends DBSchema {
  registrationId: {
    key: string;
    value: number;
  };
  identityKeyPair: {
    key: string;
    value: SerializedKeyPair;
  };
  privatePreKeys: {
    key: number;
    value: SerializedKeyPair;
  };
  signedPreKeys: {
    key: number;
    value: SerializedSignedPreKey;
  };
  sessions: {
    key: string;
    value: string;
  };
}

export class SignalStorage extends StorageFactory<StorageSchema> {
  public version = 1;
  public namespace = "superduper.so";
  public databaseName: string;
  public migrations = {
    1(db: IDBPDatabase<StorageSchema>) {
      console.log("calling upgrade");
      db.createObjectStore("identityKeyPair");
      db.createObjectStore("privatePreKeys");
      db.createObjectStore("signedPreKeys");
      db.createObjectStore("sessions");
      db.createObjectStore("registrationId");
    },
  };

  constructor(address: Address) {
    super();
    this.databaseName = "signal-" + address.toIdentifier();
  }

  static async build(address: Address): Promise<SignalStorage> {
    const service = new SignalStorage(address);
    await service.initialize();

    return service;
  }

  public async storeIdentityKeyPair(keypair: KeyPair): Promise<void> {
    const serialized = serializeKeyPair(keypair);
    await this.db.put("identityKeyPair", serialized, "me");
  }
  public async storePrivatePreKeys(keypairs: {
    [keyId: number]: SerializedKeyPair;
  }): Promise<void> {
    const tx = this.db.transaction("privatePreKeys", "readwrite");

    await Promise.all([
      Object.keys(keypairs).map((keyId) => {
        const keyIdAsInt = parseInt(keyId);
        const serializedKeyPair = keypairs[keyIdAsInt];
        return tx.store.add(serializedKeyPair, keyIdAsInt);
      }),
    ]);
  }

  public async storeRegistrationId(registrationId: number): Promise<void> {
    this.db.put("registrationId", registrationId, "me");
  }
  public async getRegistrationId(): Promise<number | undefined> {
    return this.db.get("registrationId", "me");
  }

  public async storeSession(identifier: string, record: string): Promise<void> {
    await this.db.put("sessions", record, identifier);
  }

  public async storeSignedPreKey(
    keyId: number,
    keyPair: KeyPair,
    signature: ArrayBuffer
  ): Promise<void> {
    await this.db.put(
      "signedPreKeys",
      {
        keyId,
        keyPair: serializeKeyPair(keyPair),
        signature: serializeKey(signature),
      },
      keyId
    );
  }
  public async getIdentityKeyPair(): Promise<KeyPair | undefined> {
    const serialized = await this.db.get("identityKeyPair", "me");
    if (!serialized) {
      return undefined;
    }
    return deserializeKeyPair(serialized);
  }
  public async getPreKey(keyId: number): Promise<KeyPair | undefined> {
    const serialized = await this.db.get("privatePreKeys", keyId);
    if (!serialized) {
      return undefined;
    }
    return deserializeKeyPair(serialized);
  }

  public async loadSignedPreKey(keyId: number): Promise<KeyPair | undefined> {
    const serialized = await this.db.get("signedPreKeys", keyId);
    if (!serialized) {
      return undefined;
    }
    return deserializeKeyPair(serialized.keyPair);
  }
  public async getSession(identifier: string): Promise<string | undefined> {
    return this.db.get("sessions", identifier);
  }

  public async removePreKey(keyId: number): Promise<void> {
    await this.db.delete("privatePreKeys", keyId);
  }
  public async removeSignedPreKey(keyId: number): Promise<void> {
    await this.db.delete("signedPreKeys", keyId);
  }
  public async removeSession(identifier: string): Promise<void> {
    await this.db.delete("sessions", identifier);
  }
}
