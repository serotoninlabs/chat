import { ApolloCache, ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { PreKeyBundle, SerializedPreKeyBundle } from "../types";
import { deserializeKey, serializeKey } from "../utils";
import { Address } from "./ChatService";
import { RemoteService } from "./RemoteService";

export class GraphqlRemote implements RemoteService {
  private graphql: ApolloClient<InMemoryCache>;
  constructor(graphql: ApolloClient<InMemoryCache>) {
    this.graphql = graphql;
  }
  public async generatePreKeyBundle(
    userId: string
  ): Promise<{ user: Address; bundle: PreKeyBundle }> {
    const result = await this.graphql.mutate<
      { signalGeneratePreKeyBundle: SerializedPreKeyBundle },
      any
    >({
      mutation: gql`
        mutation GeneratePreKeyBundle($userId: String!) {
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
  public async storeSignedPreKey(
    keyId: number,
    pubKey: ArrayBuffer,
    signature: ArrayBuffer
  ): Promise<void> {
    const result = await this.graphql.mutate({
      mutation: gql`
        mutation($input: SignalSignedPreKeyInput!) {
          signalStoreSignedPreKey(input: $input)
        }
      `,
      variables: {
        input: {
          keyId,
          pubKey: serializeKey(pubKey),
          signature: serializeKey(signature),
        },
      },
    });
  }
  public async removePreKey(keyId: number): Promise<void> {
    await this.graphql.mutate({
      mutation: gql`
        mutation RemovePreKey($keyId: Int!) {
          signalRemovePreKey(keyId: $keyId)
        }
      `,
      variables: {
        keyId,
      },
    });
  }
  public async storePreKeys(
    publicPreKeys: { keyId: number; pubKey: string }[]
  ): Promise<void> {
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
  }
  public async loadIdentityKey(
    identifier: string
  ): Promise<undefined | ArrayBuffer> {
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
    identityKey: string
  ): Promise<void> {
    const result = await this.graphql.mutate({
      mutation: gql`
        mutation saveIdentity($identifier: String!, $identityKey: String!) {
          signalSaveIdentity(identifier: $identifier, identityKey: $identityKey)
        }
      `,
      variables: {
        identifier,
        identityKey,
      },
    });
  }
  removeAllSessions(identifier: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
