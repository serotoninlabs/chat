import { DeviceRegistration, SignalStorage } from "./SignalStorage";
import { RemoteDeviceRegistration, RemoteService } from "./RemoteService";
import ByteBuffer from "bytebuffer";

import {
  EncryptedMessage,
  KeyPair,
  PreKey,
  SerializedKeyPair,
  SessionCipher,
  SignalLibrary,
} from "../types";

import { SecureMessage } from "./SecureMessage";
import { SignalCore } from "./SignalCore";
import { serializeKeyPair } from "../utils";

export type Address = {
  userId: string;
  deviceId: string;
};
export function AddressToString(address: Address): string {
  return `${address.userId}.${address.deviceId}`;
}

export function AddressFromString(identifier: string): Address {
  const [userId, deviceId] = identifier.split(".");
  return { userId, deviceId };
}

export type EncryptedSession = {
  address: Address;
  cipher: SessionCipher;
};

export class SignalService {
  private core!: SignalCore;
  private storage: SignalStorage;
  private remote: RemoteService;
  private lib!: SignalLibrary;
  private address!: Address;
  private decryptedMessageCallbacks: Array<
    (sender: Address, message: SecureMessage) => void
  > = [];

  static async build(
    remote: RemoteService,
    userId: string,
    storagePrefix?: string
  ): Promise<SignalService> {
    const storage = await SignalStorage.build(
      storagePrefix ? `${userId}/${storagePrefix}` : userId
    );
    const service = new SignalService(storage, remote);
    await service.initialize(userId);
    return service;
  }

  constructor(storage: SignalStorage, remote: RemoteService) {
    this.storage = storage;
    this.remote = remote;
  }

  public async initialize(userId: string) {
    // @ts-ignore
    await import("libsignal-protocol/dist/libsignal-protocol");
    this.lib = (window as any).libsignal;

    let registration = await this.storage.getDeviceRegistration();
    if (!registration) {
      registration = await this.registerDevice(userId);
    }
    this.address = registration.address;
    this.core = new SignalCore(this.lib, this.storage, registration.address);

    this.remote.subscribe(this.address, (receiptId, sender, message) =>
      this.onRemoteMessage(receiptId, sender, message)
    );
  }

  // this is not part of the signal.storage interface so we can change this
  public async registerDevice(
    userId: string,
    numPreKeys: number = 40
  ): Promise<DeviceRegistration> {
    const { KeyHelper } = this.lib;
    const identityKeyPair = await KeyHelper.generateIdentityKeyPair();

    let promises = [];
    for (let i = 0; i < numPreKeys; i++) {
      promises[i] = KeyHelper.generatePreKey(i + 1);
    }
    const preKeys = await Promise.all(promises);
    const signedPreKeyId = 0;
    const signedPreKey = await KeyHelper.generateSignedPreKey(
      identityKeyPair,
      signedPreKeyId
    );

    const remoteRegistration: RemoteDeviceRegistration = {
      userId,
      identityPublicKey: identityKeyPair.pubKey,
      publicPreKeys: preKeys.map((p) => ({
        keyId: p.keyId,
        pubKey: p.keyPair.pubKey,
      })),
      signedPreKey: {
        keyId: signedPreKey.keyId,
        pubKey: signedPreKey.keyPair.pubKey,
        signature: signedPreKey.signature,
      },
    };
    const result = await this.remote.registerDevice(remoteRegistration);
    const deviceRegistration: DeviceRegistration = {
      address: { userId, deviceId: result.deviceId },
      registrationId: result.registrationId,
      identityKeyPair,
    };
    await this.storage.registerDevice(
      deviceRegistration,
      preKeys,
      signedPreKey
    );

    return deviceRegistration;
  }

  public getAddressString(): string {
    if (!this.address) {
      throw new Error("address not initalized");
    }
    return AddressToString(this.address);
  }
  public getAddress(): Address {
    return this.address;
  }

  public async onRemoteMessage(
    receiptId: string,
    sender: Address,
    message: EncryptedMessage
  ): Promise<void> {
    console.log(
      "received onRemoteMessage",
      AddressToString(this.address),
      sender,
      message
    );
    try {
      const plaintext = await this.decrypt(sender, message);
      for (const cb of this.decryptedMessageCallbacks) {
        console.log("calling decryptedMessageCallbacks");
        cb(sender, plaintext);
      }
    } catch (err) {
      if (
        err.message !==
        "Message key not found. The counter was repeated or the key was not filled."
      ) {
        throw err;
      } else {
        console.log("caught b ut continuing", err.message);
      }
    }

    await this.remote.acknowledgeMessages(this.address, [receiptId]);
  }
  public async teardown() {}

  public async decryptedMessageSubscribe(
    cb: (sender: Address, message: SecureMessage) => void
  ) {
    this.decryptedMessageCallbacks.push(cb);
  }
  public async decryptedMessageUnsubscribe(
    cb: (sender: Address, payload: SecureMessage) => void
  ) {
    const idx = this.decryptedMessageCallbacks.indexOf(cb);
    if (idx >= 0) {
      this.decryptedMessageCallbacks = [
        ...this.decryptedMessageCallbacks.slice(0, idx),
        ...this.decryptedMessageCallbacks.slice(
          idx,
          this.decryptedMessageCallbacks.length
        ),
      ];
    }
  }

  public async startSession(address: Address): Promise<void> {
    const bundle = await this.remote.generatePreKeyBundle(address);
    const signalAddress = new this.lib.SignalProtocolAddress(
      bundle.address.userId,
      bundle.address.deviceId
    );
    const sessionBuilder = new this.lib.SessionBuilder(
      this.core,
      signalAddress
    );
    await sessionBuilder.processPreKey(bundle);
  }

  public async encrypt(
    recipient: Address,
    message: SecureMessage
  ): Promise<EncryptedMessage> {
    const plaintext = JSON.stringify(message);
    const ab = ByteBuffer.wrap(plaintext, "utf8").toArrayBuffer();

    const session = await this.storage.getSession(AddressToString(recipient));
    if (!session) {
      console.log(
        `${AddressToString(
          this.address
        )} starting session with ${AddressToString(recipient)} (encrypt)`
      );
      await this.startSession(recipient);
    }
    const signalAddress = new this.lib.SignalProtocolAddress(
      recipient.userId,
      recipient.deviceId
    );
    const cipher = new this.lib.SessionCipher(this.core, signalAddress);

    return cipher.encrypt(ab);
  }

  public async decrypt(
    sender: Address,
    ciphertext: EncryptedMessage
  ): Promise<SecureMessage> {
    const signalAddress = new this.lib.SignalProtocolAddress(
      sender.userId,
      sender.deviceId
    );
    console.log(
      `${AddressToString(this.address)} starting session with ${AddressToString(
        sender
      )} (decrypt)`
    );
    const session = this.storage.getSession(AddressToString(sender));
    if (!session) {
      await this.startSession(sender);
    }
    const cipher = new this.lib.SessionCipher(this.core, signalAddress);

    // Decrypt a PreKeyWhisperMessage by first establishing a new session.
    // Returns a promise that resolves when the message is decrypted or
    // rejects if the identityKey differs from a previously seen identity for this
    // address.
    let plaintext: string;
    if (ciphertext.type === 3) {
      console.log(
        `${AddressToString(this.address)} decryptPreKeyWhisperMessage`
      );
      const result = await cipher.decryptPreKeyWhisperMessage(
        ciphertext.body,
        "binary"
      );
      plaintext = ByteBuffer.wrap(result, "binary").toUTF8();
      // await this.sendMessage(senderId, deviceId, "ACK");
    } else {
      console.log(`${AddressToString(this.address)} decryptWhisperMessage`);
      const result = await cipher.decryptWhisperMessage(
        ciphertext.body,
        "binary"
      );
      plaintext = ByteBuffer.wrap(result, "binary").toUTF8();
    }
    return JSON.parse(plaintext);
  }

  // // this is not part of the signal.storage interface so we can change this
  // public async registerDevice(
  //   numPreKeys: number = 20
  // ): Promise<KeyPair> {
  //   const existingKeypair = await this.storage.getIdentityKeyPair();
  //   if (existingKeypair) {
  //     return existingKeypair;
  //   }
  //   const { KeyHelper } = this.lib;
  //   const identityKeys = await KeyHelper.generateIdentityKeyPair();

  //   this.remote.registerDevice();

  //   // await this.core.saveIdentity(
  //   //   AddressToString(this.address),
  //   //   identityKeys.pubKey
  //   // );

  //   let promises = [];
  //   for (let i = 0; i < numPreKeys; i++) {
  //     promises[i] = KeyHelper.generatePreKey(i + 1);
  //   }
  //   const preKeys = await Promise.all(promises);
  //   await this.storePreKeys(preKeys);

  //   const signedPreKeyId = 0;
  //   const signedPreKey = await KeyHelper.generateSignedPreKey(
  //     identityKeys,
  //     signedPreKeyId
  //   );

  //   return identityKeys;
  // }

  // public async storePreKeys(preKeys: PreKey[]): Promise<void> {
  //   let privatePreKeys: { [keyId: number]: SerializedKeyPair } = {};
  //   let publicPreKeys: PreKey[] = [];

  //   preKeys.forEach((preKey, i) => {
  //     privatePreKeys[preKey.keyId] = serializeKeyPair(preKey.keyPair);

  //     publicPreKeys[i] = preKey;
  //   });

  //   await this.remote.storePreKeys(this.address, publicPreKeys);
  //   await this.storage.storePrivatePreKeys(privatePreKeys);
  // }

  // public async storeSignedPreKey(
  //   keyId: number,
  //   keyPair: KeyPair,
  //   signature: ArrayBuffer
  // ) {
  //   await this.remote.storeSignedPreKey(
  //     this.address,
  //     keyId,
  //     keyPair.pubKey,
  //     signature
  //   );
  //   await this.storage.storeSignedPreKey(keyId, keyPair, signature);
  // }

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
  }
}
