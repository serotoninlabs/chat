import { openDB, DBSchema, IDBPDatabase } from "idb";
import { EncryptedMessage, PreKey, PreKeyBundle } from "../types";
import { deserializeKey, serializeKey } from "../utils";
import { Address, AddressFromString, AddressToString } from "./SignalService";
import {
  RegistrationResult,
  RemoteDeviceRegistration,
  RemoteService,
} from "./RemoteService";
import { SignalService } from "./SignalService";
import { ConversationMetadata } from "./ChatService";

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
      userId: string;
      addresses: string[];
    };
  };
}

const allCallbacks: {
  [key: string]: Array<
    (
      receiptId: string,
      sender: Address,
      message: EncryptedMessage
    ) => Promise<void>
  >;
} = {};

export class DemoRemoteService implements RemoteService {
  private address!: Address;
  private db!: IDBPDatabase<RemoteStorageSchema>;

  public setAddress(address: Address) {
    console.log("setting address", address);
    this.address = address;
  }

  public async registerDevice(
    registration: RemoteDeviceRegistration
  ): Promise<RegistrationResult> {
    const registrationId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const user = await this.db.get("users", registration.userId);
    const deviceId = user ? (user.addresses.length + 1).toString() : "1";
    const address = { userId: registration.userId, deviceId };

    const preKeys: { [keyId: number]: { pubKey: string } } = {};
    for (const preKey of registration.publicPreKeys) {
      preKeys[preKey.keyId] = {
        pubKey: serializeKey(preKey.pubKey),
      };
    }

    const identity: Identity = {
      identityKey: serializeKey(registration.identityPublicKey),
      preKeys,
      signedPreKeys: {
        [registration.signedPreKey.keyId]: {
          pubKey: serializeKey(registration.signedPreKey.pubKey),
          signature: serializeKey(registration.signedPreKey.signature),
        },
      },
    };

    await this.db.put("identities", identity, AddressToString(address));

    const userId = registration.userId;
    if (!user) {
      this.db.put(
        "users",
        { userId, addresses: [`${userId}.${deviceId}`] },
        userId
      );
    } else {
      this.db.put(
        "users",
        { userId, addresses: user.addresses.concat([`${userId}.${deviceId}`]) },
        userId
      );
    }

    return {
      deviceId,
      registrationId,
    };
  }
  public async send(
    sender: Address,
    recipient: Address,
    message: EncryptedMessage
  ): Promise<void> {
    console.log(
      "send",
      sender,
      recipient,
      allCallbacks,
      AddressToString(recipient),
      allCallbacks[AddressToString(recipient)]
    );
    const callbacks = allCallbacks[AddressToString(recipient)];
    if (callbacks) {
      for (const cb of callbacks) {
        await cb("n/a", sender, message);
      }
    }
  }
  public async getUserAddresses(userId: string): Promise<Address[]> {
    throw new Error("Method not implemented.");
  }

  public async invitationResponse(
    sender: Address,
    senderUserId: string,
    accept: boolean
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async invite(
    sender: Address,
    invitations: { recipient: Address; ciphertext: EncryptedMessage }[],
    tags: string[]
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  subscribe(
    subscriber: Address,
    onMessage: (
      receiptId: string,
      sender: Address,
      message: EncryptedMessage
    ) => Promise<void>
  ): void {
    console.log("subscribing address", this.address);
    const userCallbacks = allCallbacks[AddressToString(subscriber)];
    if (!userCallbacks) {
      allCallbacks[AddressToString(subscriber)] = [onMessage];
    } else {
      userCallbacks.push(onMessage);
    }
  }
  public async acknowledgeMessages(
    address: Address,
    messageIds: string[]
  ): Promise<void> {
    return;
  }
  unsubscribe(
    subscriber: Address,
    onMessage: (sender: Address, message: EncryptedMessage) => Promise<void>
  ): void {
    throw new Error("Method not implemented.");
  }
  static async build(): Promise<DemoRemoteService> {
    const service = new DemoRemoteService();
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

  public async getConversationMetadata(
    conversationId: string
  ): Promise<ConversationMetadata> {
    const users = ["alice", "bob", "carol"];

    let addresses: Address[] = [];
    for (const username of users) {
      const user = await this.db.get("users", username);
      if (user) {
        addresses = addresses.concat(
          user.addresses.map((i) => AddressFromString(i))
        );
      }
    }

    return {
      id: conversationId,
      members: {
        alice: { id: "alice", profile: { username: "alice" } },
        bob: { id: "bob", profile: { username: "bob" } },
        carol: { id: "carol", profile: { username: "carol" } },
      },
      participants: addresses,
      admins: [addresses[0]],
    };
  }

  public async generatePreKeyBundle(address: Address): Promise<PreKeyBundle> {
    const identity = await this.db.get("identities", AddressToString(address));
    if (!identity) {
      throw new Error("couldnt find identity");
    }

    const preKeyId = parseInt(Object.keys(identity.preKeys)[0]);
    const preKey = identity.preKeys[preKeyId];
    const signedPreKeyId = parseInt(Object.keys(identity.signedPreKeys)[0]);
    const signedPreKey = identity.signedPreKeys[signedPreKeyId];

    const rtn = {
      address,
      registrationId: SignalService.userIdToRegistrationId(address.userId),
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
    };

    // delete prekey
    delete identity.preKeys[preKeyId];
    const updatedIdentity = { ...identity, preKeys: identity.preKeys };
    await this.db.put("identities", updatedIdentity, AddressToString(address));

    console.log("bundle", rtn);
    return rtn;
  }
  public async storePreKeys(
    address: Address,
    publicPreKeys: PreKey[]
  ): Promise<void> {
    const identity = await this.db.get("identities", AddressToString(address));
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
    await this.db.put("identities", update, AddressToString(address));
  }
  public async storeSignedPreKey(
    address: Address,
    keyId: number,
    pubKey: ArrayBuffer,
    signature: ArrayBuffer
  ): Promise<void> {
    const identity = await this.db.get("identities", AddressToString(address));
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
    await this.db.put("identities", update, AddressToString(address));
  }
}
