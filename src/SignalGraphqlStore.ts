import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import {
  SignalLibrary,
  KeyPair,
  SerializedKeyPair,
  SignedPreKey,
  PreKey,
  SerializedSignedPreKey,
} from "./types";
import {
  deserializeKey,
  deserializeKeyPair,
  serializeKey,
  serializeKeyPair,
} from "./utils";

interface LocalState {
  registrationId: number;
  identityKeyPair: SerializedKeyPair;
  privatePreKeys: { [keyId: number]: SerializedKeyPair };
  signedPreKeys: { [keyId: number]: SerializedSignedPreKey };
}

const LOCALSTORAGE_KEY = "SEROTONIN_CHAT_STATE";

export class SignalGraphqlStore {
  private lib: SignalLibrary;
  private graphql: ApolloClient<NormalizedCacheObject>;
  private localState?: LocalState;

  public Direction = {
    SENDING: 1,
    RECEIVING: 2,
  };

  constructor(
    lib: SignalLibrary,
    graphql: ApolloClient<NormalizedCacheObject>
  ) {
    this.lib = lib;
    this.graphql = graphql;
    this.localState = this.loadLocalState();
  }
  public async getIdentityKeyPair(): Promise<KeyPair> {
    if (!this.localState || !this.localState.identityKeyPair) {
      throw new Error("no identity loaded");
    }

    return deserializeKeyPair(this.localState.identityKeyPair);
  }
  public async getLocalRegistrationId() {
    console.log("getLocalRegistrationId", this.localState);
    return this.localState && this.localState.registrationId;
  }

  public async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    direction: any
  ): Promise<boolean> {
    console.log("isTrustedIdentity", identifier, identityKey);
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
    console.log("loadIdentityKey", identifier);
    if (identifier === null || identifier === undefined) {
      throw new Error("Tried to get identity key for undefined/null key");
    }

    const result = await this.graphql.query({
      query: gql`
        query($identifier: String!) {
          signalGetIdentityKey(userId: $identifier)
        }
      `,
      variables: { identifier },
    });

    console.log("loadIdentityKey", result);
    if (result.data.signalGetIdentityKey === null) {
      return;
    }

    return deserializeKey(result.data.signalGetIdentityKey);
  }

  public async saveIdentity(
    identifier: string,
    identityKey: ArrayBuffer
  ): Promise<boolean> {
    console.log("saveIdentity", identifier, identityKey);
    if (identifier === null || identifier === undefined)
      throw new Error("Tried to put identity key for undefined/null key");

    const address = new this.lib.SignalProtocolAddress(identifier, deviceId);

    const existing = await this.loadIdentityKey(address.getName());
    if (existing && serializeKey(identityKey) !== serializeKey(existing)) {
      return true;
    }

    const result = await this.graphql.mutate({
      mutation: gql`
        mutation saveIdentity($identifier: String!, $identityKey: String!) {
          signalSaveIdentity(identifier: $identifier, identityKey: $identityKey)
        }
      `,
      variables: {
        identifier,
        identityKey: serializeKey(identityKey),
      },
    });

    console.log("result", result);

    return false;
  }

  /* Returns a prekeypair object or undefined */
  public async loadPreKey(keyId: number): Promise<KeyPair | undefined> {
    console.log("loadPreKey", keyId);
    if (!this.localState) {
      throw new Error("no identity loaded");
    }
    const preKey = this.localState.privatePreKeys[keyId];
    console.log("preKey: ", deserializeKeyPair(preKey));

    return deserializeKeyPair(preKey);
  }
  public async storePreKey(keyId: number, keyPair: KeyPair): Promise<void> {
    console.log("storePreKey", keyId, keyPair);

    const result = await this.graphql.mutate({
      mutation: gql`
        mutation storePreKey($input: SignalPreKeyInput!) {
          signalStorePreKey(input: $input)
        }
      `,
      variables: {
        input: {
          keyId,
          pubKey: serializeKey(keyPair.pubKey),
        },
      },
    });
    console.log("storePreKey result", result);

    this.localState?.privatePreKeys;

    // return this.put("25519KeypreKey" + keyId, keyPair);
  }
  public async storePreKeys(preKeys: PreKey[]): Promise<void> {
    console.log("storePreKeys", preKeys);
    if (!this.localState) {
      throw new Error("no identity loaded");
    }

    let privatePreKeys: { [keyId: number]: SerializedKeyPair } = {};
    let publicPreKeys: { keyId: number; pubKey: string }[] = [];

    preKeys.forEach((preKey, i) => {
      privatePreKeys[preKey.keyId] = serializeKeyPair(preKey.keyPair);

      publicPreKeys[i] = {
        keyId: preKey.keyId,
        pubKey: serializeKey(preKey.keyPair.pubKey),
      };
    });

    const result = await this.graphql.mutate({
      mutation: gql`
        mutation storePreKeys($input: [SignalPreKeyInput!]!) {
          signalStorePreKeys(input: $input)
        }
      `,
      variables: {
        input: publicPreKeys,
      },
    });
    console.log("storePreKey result", result);

    this.localState.privatePreKeys = privatePreKeys;
    const nextLocalState = {
      ...this.localState,
      ["privatePreKeys"]: {
        ...this.localState.privatePreKeys,
        ...privatePreKeys,
      },
    };
    this.storeLocalState(nextLocalState);
    console.log("storePreKeys result", result);
  }
  public async removePreKey(keyId: number) {
    if (!this.localState) {
      throw new Error("no identity loaded");
    }
    console.log("removePreKey", keyId);

    // TODO(dankins): remove from server
    const result = await this.graphql.mutate({
      mutation: gql`
        mutation RemovePreKey($keyId: Int!) {
          signalRemovePreKey(keyId: $keyId)
        }
      `,
      variables: {
        keyId,
      },
    });

    delete this.localState.privatePreKeys[keyId];
    const nextLocalState = {
      ...this.localState,
      ["privatePreKeys"]: {
        ...this.localState.privatePreKeys,
      },
    };
    this.storeLocalState(nextLocalState);

    console.log("result", result);
  }

  /* Returns a signed keypair object or undefined */
  public async loadSignedPreKey(keyId: number): Promise<KeyPair | undefined> {
    if (!this.localState) {
      throw new Error("no identity loaded");
    }
    console.log("loadSignedPreKey", keyId);
    const signedPreKey = this.localState.signedPreKeys[keyId];

    const rtn = {
      keyId: signedPreKey.keyId,
      keyPair: deserializeKeyPair(signedPreKey.keyPair),
      signature: deserializeKey(signedPreKey.signature),
    };

    console.log("loadSignedPreKey result", rtn);
    return deserializeKeyPair(signedPreKey.keyPair);
  }
  public async storeSignedPreKey(
    keyId: number,
    keyPair: KeyPair,
    signature: ArrayBuffer
  ) {
    if (!this.localState) {
      throw new Error("no identity loaded");
    }
    console.log("storeSignedPreKey", keyId, keyPair, signature);

    const result = await this.graphql.mutate({
      mutation: gql`
        mutation($input: SignalSignedPreKeyInput!) {
          signalStoreSignedPreKey(input: $input)
        }
      `,
      variables: {
        input: {
          keyId,
          pubKey: serializeKey(keyPair.pubKey),
          signature: serializeKey(signature),
        },
      },
    });

    const nextLocalState = {
      ...this.localState,
      ["signedPreKeys"]: {
        ...this.localState.signedPreKeys,
        [keyId]: {
          keyId,
          keyPair: serializeKeyPair(keyPair),
          signature: serializeKey(signature),
        },
      },
    };
    this.storeLocalState(nextLocalState);
    console.log("storeSignedPreKey result", result);
  }
  public async removeSignedPreKey(keyId: number) {
    if (!this.localState) {
      throw new Error("no identity loaded");
    }
    console.log("removeSignedPreKey", keyId);
    delete this.localState.signedPreKeys[keyId];
    const nextLocalState = {
      ...this.localState,
      ["signedPreKeys"]: {
        ...this.localState.signedPreKeys,
      },
    };
    this.storeLocalState(nextLocalState);
    // TODO(dankins)
    console.error("todo: remove signedprekey publickey from server");
  }

  public async loadSession(address: string): Promise<any> {
    console.log("loadSession", address);
    const result = await this.graphql.query({
      query: gql`
        query($address: String!) {
          signalLoadSession(address: $address)
        }
      `,
      variables: {
        address,
      },
      fetchPolicy: "no-cache",
    });

    if (!result.data.signalLoadSession) {
      return;
    }

    return result.data.signalLoadSession;
  }
  public async storeSession(
    identifier: string,
    record: string
  ): Promise<boolean> {
    console.log("store session");
    const result = await this.graphql.mutate({
      mutation: gql`
        mutation($identifier: String!, $record: String!) {
          signalStoreSession(identifier: $identifier, record: $record)
        }
      `,
      variables: {
        identifier,
        record,
      },
    });
    console.log("stored session", identifier);
    return true;
  }
  public async removeSession(identifier: string) {
    console.log("removeSession");
    const result = await this.graphql.mutate({
      mutation: gql`
        mutation($identifier: String!) {
          signalRemoveSession(identifier: $identifier)
        }
      `,
      variables: {
        identifier,
      },
    });
    console.log("removed session", identifier);
    return true;
  }
  public async removeAllSessions(identifier: string) {
    console.log("removeAllSessions", identifier);
    const result = await this.graphql.mutate({
      mutation: gql`
        mutation($identifier: String!) {
          signalRemoveAllSessions
        }
      `,
    });
    console.log("remove all session result", result);
    return true;
  }

  private storeLocalState(localState: LocalState) {
    const serialized = JSON.stringify(localState);
    localStorage.setItem(LOCALSTORAGE_KEY, serialized);
    this.localState = localState;
  }

  private loadLocalState(): LocalState | undefined {
    const rawState = localStorage.getItem(LOCALSTORAGE_KEY);
    if (rawState) {
      try {
        const rawObj = JSON.parse(rawState);
        console.log("loaded local state", rawObj);
        return rawObj as LocalState;
      } catch (err) {
        console.error("error parsing local state", err);
        return;
      }
    }

    return;
  }

  public async createIdentity(
    userId: string,
    replaceExisting: boolean,
    numPreKeys: number = 20
  ): Promise<any> {
    if (this.localState) {
      console.log("createIdentity called but one already exists");
      return this.localState.identityKeyPair;
    }
    const { KeyHelper } = this.lib;
    const registrationId = KeyHelper.generateRegistrationId();
    const identityKeys = await KeyHelper.generateIdentityKeyPair();
    const serializedIdentityKeys = serializeKeyPair(identityKeys);
    console.log("serializeKeyPair", serializedIdentityKeys);

    this.storeLocalState({
      registrationId,
      identityKeyPair: serializedIdentityKeys,
      privatePreKeys: {},
      signedPreKeys: {},
    });

    await this.saveIdentity(userId, 0, identityKeys.pubKey);
    // store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
    console.log("created identity", {
      registrationId,
      identityKeys,
    });

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
}
