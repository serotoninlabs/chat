import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client";
import ByteBuffer from "bytebuffer";
import * as sigUtil from "eth-sig-util";
import { SignalGraphqlStore } from "./SignalGraphqlStore";
import {
  PreKeyBundle,
  SerializedPreKeyBundle,
  SessionCipher,
  SignalLibrary,
} from "./types";
import {
  ab2str,
  deserializeKey,
  serializeKey,
  serializeKeyPair,
  str2ab,
} from "./utils";

export interface SignalState {
  initialized: boolean;
  registrationId?: number;
}

export class SignalServiceOld {
  private lib!: SignalLibrary;
  private store!: SignalGraphqlStore;
  private state: SignalState;
  private graphql: ApolloClient<NormalizedCacheObject>;
  private cb?: (state: SignalState) => void;

  constructor(graphql: ApolloClient<NormalizedCacheObject>) {
    this.graphql = graphql;
    this.state = {
      initialized: false,
      // registrationId: this.localState && this.localState.registrationId,
    };
  }
  public async initialize() {
    await import("libsignal-protocol/dist/libsignal-protocol");
    this.lib = (window as any).libsignal;
    this.store = new SignalGraphqlStore(this.lib, this.graphql);

    this.updateState({ initialized: true });
  }

  public async createIdentity(userId: string, replaceExisting?: boolean) {
    try {
      const result = await this.store.createIdentity(
        userId,
        replaceExisting || false
      );
    } catch (err) {
      console.error("error creating id", err);
    }

    this.updateState({ registrationId: 56 });
  }

  public async sendMessage(
    recipientUserId: string,
    deviceId: number,
    message: string
  ) {
    const address = new this.lib.SignalProtocolAddress(
      recipientUserId,
      deviceId
    );
    const sessionCipher: SessionCipher = new this.lib.SessionCipher(
      this.store,
      address
    );
    const ab = ByteBuffer.wrap(message, "binary").toArrayBuffer();
    const ciphertext = await sessionCipher.encrypt(ab);

    //const serialized = serializeKey(str2ab(ciphertext.body));
    console.log("encrypted", ab, message, ciphertext, this.lib);
    const result = await this.graphql.mutate({
      mutation: gql`
        mutation SendMessage(
          $recipientUserId: String!
          $ciphertext: SignalCiphertextInput!
        ) {
          signalSendMessage(
            recipientUserId: $recipientUserId
            ciphertext: $ciphertext
          )
        }
      `,
      variables: {
        recipientUserId,
        ciphertext: {
          type: ciphertext.type,
          registrationId: ciphertext.registrationId,
          body: ciphertext.body,
        },
      },
    });
    console.log("sendMessage result", result);
  }

  public async decrypt(
    senderId: string,
    deviceId: number,
    ciphertext: {
      body: string;
      type: number;
      registrationId: string;
    }
  ) {
    var address = new this.lib.SignalProtocolAddress(senderId, deviceId);
    var sessionCipher = new this.lib.SessionCipher(this.store, address);

    // Decrypt a PreKeyWhisperMessage by first establishing a new session.
    // Returns a promise that resolves when the message is decrypted or
    // rejects if the identityKey differs from a previously seen identity for this
    // address.
    console.log("decrypting", address, ciphertext);
    if (ciphertext.type === 3) {
      const result = await sessionCipher.decryptPreKeyWhisperMessage(
        ciphertext.body,
        "binary"
      );
      const plaintext = ByteBuffer.wrap(result, "binary").toUTF8();

      await this.sendMessage(senderId, deviceId, "ACK");

      console.log("plaintext", result, plaintext);
      return plaintext;
    } else {
      const result = await sessionCipher.decryptWhisperMessage(
        ciphertext.body,
        "binary"
      );
      const plaintext = ByteBuffer.wrap(result, "binary").toUTF8();
      console.log("plaintext", result, plaintext);
      return plaintext;
    }

    // Decrypt a normal message using an existing session
    // const result = await sessionCipher.decryptWhisperMessage(ciphertext)
  }

  public async startSession(userId: string) {
    // only support one device for now
    const deviceId = 0;
    // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
    const address = new this.lib.SignalProtocolAddress(userId, deviceId);
    const sessionBuilder = new this.lib.SessionBuilder(this.store, address);

    // const keyId = await this.store.getLocalRegistrationId();
    // const preKeyId = await this.store.loadPreKey(keyId!);
    // const signedKeyId = await this.store.loadSignedPreKey(keyId!);
    // const signedKeyId = 1;

    // const preKeyBundle = await this.generatePreKeyBundleOLD(
    //   keyId!,
    //   signedKeyId
    // );
    const preKeyBundle = await this.generatePreKeyBundle(userId, deviceId);
    console.log("preKeyBundle generated", preKeyBundle);
    const result = await sessionBuilder.processPreKey(preKeyBundle);
    console.log("processPreKey", result);
  }

  public async generatePreKeyBundle(
    userId: string,
    deviceId: number
  ): Promise<PreKeyBundle> {
    // https://signal.org/docs/specifications/x3dh/
    // Bob's identity key IKB
    // Bob's signed prekey SPKB
    // Bob's prekey signature Sig(IKB, Encode(SPKB))
    // (Optionally) Bob's one-time prekey OPKB
    const result = await this.graphql.mutate<
      { signalGeneratePreKeyBundle: SerializedPreKeyBundle },
      any
    >({
      mutation: gql`
        mutation GeneratePreKeyBundle($userId: String!, $deviceId: Int!) {
          signalGeneratePreKeyBundle(
            recipientUserId: $userId
            deviceId: $deviceId
          ) {
            registrationId
            identityKey
            signedPreKey {
              keyId
              pubKey
              signature
            }
            preKey {
              keyId
              pubKey
            }
          }
        }
      `,
      variables: {
        userId,
        deviceId,
      },
    });

    console.log("mutation result", result.data);
    if (result.errors) {
      console.error("mutation error", result.errors);
      throw new Error("error getting prekey bundle");
    }

    if (result.data === undefined || result.data === null) {
      throw new Error("error getting prekey bundle (null or undefined)");
    }

    const bundle = result.data.signalGeneratePreKeyBundle;

    return {
      registrationId: bundle.registrationId,
      identityKey: deserializeKey(bundle.identityKey),
      signedPreKey: {
        keyId: bundle.signedPreKey.keyId,
        publicKey: deserializeKey(bundle.signedPreKey.pubKey),
        signature: deserializeKey(bundle.signedPreKey.signature),
      },
      preKey: {
        keyId: bundle.preKey.keyId,
        publicKey: deserializeKey(bundle.preKey.pubKey),
      },
    };
  }

  //   public async generatePreKeyBundleOLD(
  //     preKeyId: number,
  //     signedPreKeyId: number
  //   ): Promise<PreKeyBundle> {
  //     const identity = await this.store.getIdentityKeyPair();
  //     const registrationId = await this.store.getLocalRegistrationId();
  //     if (!registrationId) {
  //       throw new Error("registrationId not loaded");
  //     }
  //     const preKey = await this.lib.KeyHelper.generatePreKey(preKeyId);
  //     const signedPreKey = await this.lib.KeyHelper.generateSignedPreKey(
  //       identity,
  //       signedPreKeyId
  //     );

  //     await this.store.storePreKey(preKeyId, preKey.keyPair);
  //     await this.store.storeSignedPreKey(
  //       signedPreKeyId,
  //       signedPreKey.keyPair,
  //       signedPreKey.signature
  //     );

  //     return {
  //       identityKey: identity.pubKey,
  //       registrationId: registrationId,
  //       preKey: {
  //         keyId: preKeyId,
  //         publicKey: preKey.keyPair.pubKey,
  //       },
  //       signedPreKey: {
  //         keyId: signedPreKeyId,
  //         publicKey: signedPreKey.keyPair.pubKey,
  //         signature: signedPreKey.signature,
  //       },
  //     };
  //   }

  public async encryptIdentity() {
    const ethereum = (window as any).ethereum;
    await ethereum.enable();
    const encryptionPublicKey = await ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: ["0x96091247C959F369fe9F8B4D2F416c839c638e70"], // you must have access to the specified account
    });

    const data = JSON.stringify(
      serializeKeyPair(await this.store.getIdentityKeyPair())
    );
    const encryptedMessage = JSON.stringify(
      sigUtil.encrypt(encryptionPublicKey, { data }, "x25519-xsalsa20-poly1305")
    );
    console.log("ciphertext: ", encryptedMessage);
  }

  public async decryptIdentity(encryptedMessage: string) {
    const ethereum = (window as any).ethereum;
    const decryptedMessage = await ethereum.request({
      method: "eth_decrypt",
      params: [encryptedMessage, "0x96091247C959F369fe9F8B4D2F416c839c638e70"],
    });
  }

  public async onStateChange(cb: (state: SignalState) => void) {
    this.cb = cb;
  }

  public getState(): SignalState {
    return this.state;
  }

  private setState(state: SignalState) {
    this.state = state;
    if (this.cb) {
      this.cb(state);
    }
  }

  private updateState(patch: Partial<SignalState>) {
    this.setState({ ...this.state, ...patch });
  }
}
