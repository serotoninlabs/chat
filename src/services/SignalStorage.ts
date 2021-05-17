import { openDB, DBSchema, IDBPDatabase } from "idb";
import {
  KeyPair,
  PreKey,
  SerializedKeyPair,
  SerializedPreKey,
  SerializedSignedPreKey,
  SignedPreKey,
} from "../types";
import {
  deserializeKey,
  deserializeKeyPair,
  serializeKey,
  serializeKeyPair,
} from "../utils";
import { SecureMessage } from "./SecureMessage";
import { Address, RawMessage } from "./SignalService";
import { StorageFactory } from "./StorageFactory";

export interface DeviceRegistration {
  address: Address;
  identityKeyPair: KeyPair;
  registrationId: number;
}

interface StorageSchema extends DBSchema {
  registration: {
    key: string;
    value: {
      address: Address;
      registrationId: number;
      identityKeyPair: SerializedKeyPair;
    };
  };
  identities: {
    key: string;
    value: string;
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
  raw_messages: {
    key: string;
    value: SecureMessage;
  };
}

export class SignalStorage extends StorageFactory<StorageSchema> {
  public version = 2;
  public namespace = "superduper.so";
  public databaseName = "signal";
  public migrations = {
    1(db: IDBPDatabase<StorageSchema>) {
      console.log("calling upgrade");
      db.createObjectStore("registration");
      db.createObjectStore("identities");
      db.createObjectStore("privatePreKeys");
      db.createObjectStore("signedPreKeys");
      db.createObjectStore("sessions");
    },
    2(db: IDBPDatabase<StorageSchema>) {
      db.createObjectStore("raw_messages");
    },
  };

  static async build(dbPrefix: string): Promise<SignalStorage> {
    const service = new SignalStorage();
    await service.initialize(dbPrefix);

    return service;
  }

  public async getDeviceRegistration(): Promise<
    DeviceRegistration | undefined
  > {
    const result = await this.db.get("registration", "me");
    if (!result) {
      return;
    }
    return {
      ...result,
      identityKeyPair: deserializeKeyPair(result.identityKeyPair),
    };
  }
  public async registerDevice(
    registration: DeviceRegistration,
    preKeys: PreKey[],
    signedPreKey: SignedPreKey
  ): Promise<void> {
    const adj = {
      ...registration,
      identityKeyPair: serializeKeyPair(registration.identityKeyPair),
    };
    await this.db.add("registration", adj, "me");
    await this.storePrivatePreKeys(preKeys);
    await this.storeSignedPreKey(
      signedPreKey.keyId,
      signedPreKey.keyPair,
      signedPreKey.signature
    );
  }

  // public async storeIdentityKeyPair(keypair: KeyPair): Promise<void> {
  //   const serialized = serializeKeyPair(keypair);
  //   const registration =
  //   await this.db.put("identityKeyPair", serialized, "me");
  // }
  public async storePrivatePreKeys(preKeys: PreKey[]): Promise<void> {
    const tx = this.db.transaction("privatePreKeys", "readwrite");

    await Promise.all([
      preKeys.map((preKey) => {
        return tx.store.add(serializeKeyPair(preKey.keyPair), preKey.keyId);
      }),
    ]);
  }

  public async getRegistrationId(): Promise<number | undefined> {
    const registration = await this.db.get("registration", "me");
    return registration?.registrationId;
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
    const registration = await this.db.get("registration", "me");
    if (!registration) {
      return undefined;
    }
    return deserializeKeyPair(registration.identityKeyPair);
  }
  public async getPreKey(keyId: number): Promise<KeyPair | undefined> {
    const serialized = await this.db.get("privatePreKeys", keyId);
    if (!serialized) {
      return undefined;
    }
    return deserializeKeyPair(serialized);
  }

  public async loadSignedPreKey(keyId: number): Promise<KeyPair | undefined> {
    console.log("calling loadSignedPreKey", keyId);
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

  public async loadIdentityKey(
    identifier: string
  ): Promise<ArrayBuffer | undefined> {
    const key = await this.db.get("identities", identifier);

    return key ? deserializeKey(key) : undefined;
  }

  public async saveIdentity(
    identifier: string,
    identityKey: ArrayBuffer
  ): Promise<boolean> {
    var existing = await this.db.get("identities", identifier);
    const serialized = serializeKey(identityKey);
    this.db.put("identities", serialized, identifier);

    if (existing && serialized !== existing) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  public async getRawMessage(
    messageId: string
  ): Promise<SecureMessage | undefined> {
    return this.db.get("raw_messages", messageId);
  }

  public async storeRawMessage(
    messageId: string,
    message: SecureMessage
  ): Promise<void> {
    await this.db.put("raw_messages", message, messageId);
  }
}
