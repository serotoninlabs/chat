import { openDB, DBSchema, IDBPDatabase } from "idb";
import {
  KeyPair,
  PreKey,
  PreKeyBundle,
  SerializedKeyPair,
  SignedPreKey,
} from "../types";
import { deserializeKey, deserializeKeyPair, serializeKey } from "../utils";
import { Address } from "./ChatService";
import { RemoteService } from "./RemoteService";
import { SignalService } from "./SignalService";

interface Identity {
  identityKey: string;
  signedPreKeys: { [keyId: number]: { pubKey: string; signature: string } };
  preKeys: { [keyId: number]: { pubKey: string } };
}

interface RemoteStorageSchema extends DBSchema {
  identities: {
    key: string;
    value: Identity;
  };
  users: {
    key: string;
    value: {
      username: string;
      addresses: string[];
    };
  };
}

export class DemoRemoteService implements RemoteService {
  private initialized = false;
  private address: Address;
  private db!: IDBPDatabase<RemoteStorageSchema>;

  constructor(address: Address) {
    this.address = address;
  }

  static async build(address: Address): Promise<DemoRemoteService> {
    const service = new DemoRemoteService(address);
    await service.init();

    return service;
  }

  public async init(): Promise<void> {
    const name = "demo-remote-service";
    const version = 3;
    this.db = await openDB<RemoteStorageSchema>(name, version, {
      upgrade(db) {
        console.log("calling upgrade on demo remote storage");
        db.createObjectStore("identities");
        db.createObjectStore("users");
      },
    });
  }

  public async generatePreKeyBundle(
    conversationId: string
  ): Promise<{ address: Address; bundle: PreKeyBundle }[]> {
    const participants = ["alice", "bob", "carol"];
    const users = await Promise.all(
      participants.map((uid) => this.db.get("users", uid))
    );

    let allAddresses: string[] = [];
    users.forEach((u) => {
      if (u) {
        allAddresses = allAddresses.concat(u.addresses);
      }
    }, []);

    let results: { address: Address; bundle: PreKeyBundle }[] = [];
    for (const address of allAddresses) {
      if (address == this.address.toIdentifier()) {
        continue;
      }
      const identity = await this.db.get("identities", address);
      if (!identity) {
        throw new Error("couldnt find identity");
      }

      const preKeyId = parseInt(Object.keys(identity.preKeys)[0]);
      const preKey = identity.preKeys[preKeyId];
      const signedPreKeyId = parseInt(Object.keys(identity.signedPreKeys)[0]);
      const signedPreKey = identity.signedPreKeys[signedPreKeyId];

      const userAddress = Address.fromString(address);
      results.push({
        address: userAddress,
        bundle: {
          registrationId: SignalService.userIdToRegistrationId(
            userAddress.userId
          ),
          identityKey: deserializeKey(identity.identityKey),
          signedPreKey: {
            keyId: signedPreKeyId,
            publicKey: deserializeKey(signedPreKey.pubKey),
            signature: deserializeKey(signedPreKey.signature),
          },
          preKey: {
            keyId: preKeyId,
            publicKey: deserializeKey(preKey.pubKey),
          },
        },
      });
    }

    return results;
  }
  public async saveIdentity(
    identifier: string,
    identityKey: string
  ): Promise<void> {
    const identity: Identity = {
      identityKey,
      signedPreKeys: [],
      preKeys: {},
    };
    if (this.address.toIdentifier() !== identifier) {
      return;
    }
    await this.db.add("identities", identity, identifier);

    const username = identifier.split(".")[0];
    const user = await this.db.get("users", username);
    if (!user) {
      this.db.put("users", { username, addresses: [identifier] }, username);
    } else {
      this.db.put(
        "users",
        { username, addresses: user.addresses.concat([identifier]) },
        username
      );
    }
  }
  public async loadIdentityKey(
    identifier: string
  ): Promise<ArrayBuffer | undefined> {
    const result = await this.db.get("identities", identifier);
    if (!result) {
      return;
    }
    return deserializeKey(result.identityKey);
  }
  public async storePreKeys(publicPreKeys: PreKey[]): Promise<void> {
    const identity = await this.db.get(
      "identities",
      this.address.toIdentifier()
    );
    if (!identity) {
      throw new Error("identity not found");
    }

    const nextPreKeys = identity.preKeys;
    for (const preKey of publicPreKeys) {
      nextPreKeys[preKey.keyId] = {
        pubKey: serializeKey(preKey.keyPair.pubKey),
      };
    }

    const update = {
      ...identity,
      preKeys: nextPreKeys,
    };
    await this.db.put("identities", update, this.address.toIdentifier());
  }
  public async removePreKey(keyId: number): Promise<void> {
    const identity = await this.db.get(
      "identities",
      this.address.toIdentifier()
    );
    if (!identity) {
      throw new Error("identity not found");
    }

    const { [keyId]: removed, ...nextPreKeys } = identity.preKeys;
    const update = {
      ...identity,
      preKeys: nextPreKeys,
    };
    await this.db.put("identities", update, this.address.toIdentifier());
  }
  public async storeSignedPreKey(
    keyId: number,
    pubKey: ArrayBuffer,
    signature: ArrayBuffer
  ): Promise<void> {
    const identity = await this.db.get(
      "identities",
      this.address.toIdentifier()
    );
    if (!identity) {
      throw new Error("identity not found");
    }

    const next = {
      ...identity.signedPreKeys,
      [keyId]: {
        pubKey: serializeKey(pubKey),
        signature: serializeKey(signature),
      },
    };

    const update = {
      ...identity,
      signedPreKeys: next,
    };
    await this.db.put("identities", update, this.address.toIdentifier());
  }
}
