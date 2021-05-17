import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { EncryptedMessage, PreKey, PreKeyBundle } from "../types";
import { deserializeKey, serializeKey } from "../utils";
import { Address } from "./SignalService";
import {
  AcknowledgeMessagesDocument,
  AcknowledgeMessagesMutation,
  AcknowledgeMessagesMutationVariables,
  StoreSignedPreKeyDocument,
  StoreSignedPreKeyMutation,
  StoreSignedPreKeyMutationVariables,
  StorePreKeysMutation,
  StorePreKeysDocument,
  StorePreKeysMutationVariables,
  SignalPreKeyInput,
  RemovePreKeyMutation,
  RemovePreKeyDocument,
  RegisterDeviceDocument,
  RegisterDeviceMutation,
  RegisterDeviceMutationVariables,
  GetConversationDocument,
  GetConversationQuery,
  GetConversationQueryVariables,
  OnMessageAddedDocument,
  OnMessageAddedSubscription,
  OnMessageAddedSubscriptionVariables,
  GeneratePreKeyBundleDocument,
  GeneratePreKeyBundleMutation,
  GeneratePreKeyBundleMutationVariables,
  SendMessageDocument,
  SendMessageMutation,
  SendMessageMutationVariables,
  RemovePreKeyMutationVariables,
  Conversation,
  InvitationResponseDocument,
  InvitationResponseMutation,
  InvitationResponseMutationVariables,
  InviteDocument,
  InviteMutation,
  InviteMutationVariables,
  UserAddressesQuery,
  UserAddressesDocument,
  UserAddressesQueryVariables,
} from "./graphql/generated";
import {
  RegistrationResult,
  RemoteDeviceRegistration,
  RemoteService,
} from "./RemoteService";
import { ConversationMetadata } from "./ChatService";

export class GraphqlRemoteService implements RemoteService {
  private initialized = false;
  private graphql: ApolloClient<NormalizedCacheObject>;

  constructor(graphql: ApolloClient<NormalizedCacheObject>) {
    this.graphql = graphql;
  }
  public async getUserAddresses(userId: string): Promise<Address[]> {
    const result = await this.graphql.query<
      UserAddressesQuery,
      UserAddressesQueryVariables
    >({
      query: UserAddressesDocument,
      variables: {
        userId,
      },
    });

    if (result.errors) {
      console.log("graphql error", result.errors);
      throw new Error(result.errors[0].message);
    }
    return result.data.signalUserAddresses;
  }

  public subscribe(
    subscriber: Address,
    onMessage: (
      receiptId: string,
      sender: Address,
      message: EncryptedMessage
    ) => Promise<void>
  ): void {
    const subscription = this.graphql.subscribe<
      OnMessageAddedSubscription,
      OnMessageAddedSubscriptionVariables
    >({
      query: OnMessageAddedDocument,
      variables: {
        deviceId: subscriber.deviceId,
      },
    });

    subscription.subscribe({
      next(result) {
        console.log("!!!!", result);
        if (result.data) {
          const message = result.data.signalMessages;
          onMessage(message.receiptId, message.sender, message.ciphertext);
        }
      },
      error(err) {
        console.error("err", err);
      },
    });
  }
  public unsubscribe(
    subscriber: Address,
    onMessage: (sender: Address, message: EncryptedMessage) => Promise<void>
  ): void {
    throw new Error("Method not implemented.");
  }

  public async acknowledgeMessages(
    address: Address,
    messageIds: string[]
  ): Promise<void> {
    const result = await this.graphql.mutate<
      AcknowledgeMessagesMutation,
      AcknowledgeMessagesMutationVariables
    >({
      mutation: AcknowledgeMessagesDocument,
      variables: {
        deviceId: address.deviceId,
        messageIds,
      },
    });

    if (result.errors) {
      console.log("graphql errors", result);
      throw new Error("graphql error");
    }
    if (!result.data) {
      throw new Error("no data");
    }
  }

  public async registerDevice(
    registration: RemoteDeviceRegistration
  ): Promise<RegistrationResult> {
    const result = await this.graphql.mutate<
      RegisterDeviceMutation,
      RegisterDeviceMutationVariables
    >({
      mutation: RegisterDeviceDocument,
      variables: {
        input: {
          userId: registration.userId,
          identityPublicKey: serializeKey(registration.identityPublicKey),
          signedPreKey: {
            keyId: registration.signedPreKey.keyId,
            pubKey: serializeKey(registration.signedPreKey.pubKey),
            signature: serializeKey(registration.signedPreKey.signature),
          },
          publicPreKeys: registration.publicPreKeys.map((p) => ({
            keyId: p.keyId,
            pubKey: serializeKey(p.pubKey),
          })),
        },
      },
    });

    if (result.errors) {
      console.log("graphql errors", result);
      throw new Error("graphql error");
    }
    if (!result.data) {
      throw new Error("no data");
    }

    return result.data.signalRegisterDevice;
  }

  public async send(
    sender: Address,
    recipient: Address,
    message: EncryptedMessage
  ): Promise<void> {
    console.log("sending message mutation", sender, recipient, message);
    const result = await this.graphql.mutate<
      SendMessageMutation,
      SendMessageMutationVariables
    >({
      mutation: SendMessageDocument,
      variables: {
        deviceId: sender.deviceId,
        recipient: {
          userId: recipient.userId,
          deviceId: recipient.deviceId,
        },
        ciphertext: message,
      },
    });
    console.log("sending message mutation success", result);
  }

  public async invite(
    sender: Address,
    invitations: { recipient: Address; ciphertext: EncryptedMessage }[],
    tags: string[]
  ): Promise<void> {
    console.log("sending joinRequest", sender, invitations);
    const result = await this.graphql.mutate<
      InviteMutation,
      InviteMutationVariables
    >({
      mutation: InviteDocument,
      variables: {
        deviceId: sender.deviceId,
        invitations,
        tags,
      },
    });
    console.log("sending message mutation success", result);
  }
  public async invitationResponse(
    sender: Address,
    senderUserId: string,
    accept: boolean
  ): Promise<void> {
    console.log("sending joinRequest", sender, senderUserId, accept);
    const result = await this.graphql.mutate<
      InviteMutation,
      InvitationResponseMutationVariables
    >({
      mutation: InvitationResponseDocument,
      variables: {
        deviceId: sender.deviceId,
        senderUserId,
        accept,
      },
    });
    console.log("invitationResponse mutation success", result);
  }

  public async getConversationMetadata(
    conversationId: string
  ): Promise<ConversationMetadata> {
    const result = await this.graphql.query<
      GetConversationQuery,
      GetConversationQueryVariables
    >({
      query: GetConversationDocument,
      variables: { conversationId },
    });

    if (result.errors || result.error) {
      console.log("graphql errors", result);
      throw new Error("graphql error");
    }
    if (!result.data) {
      throw new Error("no data");
    }

    const members: ConversationMetadata["members"] = {};
    for (const member of result.data.conversation.members) {
      members[member.id] = member;
    }

    const admins = result.data.conversation.participants.filter((address) => {
      return result.data.conversation.adminUserIds.indexOf(address.userId) > -1;
    });

    return {
      id: result.data.conversation.id,
      members: members,
      participants: result.data.conversation.participants,
      admins,
    };
  }

  public async generatePreKeyBundle(address: Address): Promise<PreKeyBundle> {
    const result = await this.graphql.mutate<
      GeneratePreKeyBundleMutation,
      GeneratePreKeyBundleMutationVariables
    >({
      mutation: GeneratePreKeyBundleDocument,
      variables: {
        address: {
          userId: address.userId,
          deviceId: address.deviceId,
        },
      },
    });

    if (result.errors) {
      console.log("graphql errors", result.errors);
      throw new Error("graphql error");
    }
    if (!result.data) {
      throw new Error("no data");
    }

    const bundle = result.data.signalGeneratePreKeyBundle;
    return {
      address: bundle.address,
      registrationId: bundle.registrationId,
      identityKey: deserializeKey(bundle.identityKey),
      signedPreKey: {
        keyId: bundle.signedPreKey.keyId,
        publicKey: deserializeKey(bundle.signedPreKey.pubKey),
        signature: deserializeKey(bundle.signedPreKey.signature),
      },
      preKey: {
        keyId: bundle.preKey!.keyId,
        publicKey: deserializeKey(bundle.preKey!.pubKey),
      },
    };
  }
  public async storePreKeys(
    currentAddress: Address,
    publicPreKeys: PreKey[]
  ): Promise<void> {
    const input = publicPreKeys.map((preKey) => {
      const i: SignalPreKeyInput = {
        keyId: preKey.keyId,
        pubKey: serializeKey(preKey.keyPair.pubKey),
      };
      return i;
    });
    const result = await this.graphql.mutate<
      StorePreKeysMutation,
      StorePreKeysMutationVariables
    >({
      mutation: StorePreKeysDocument,
      variables: {
        deviceId: currentAddress.deviceId,
        input,
      },
    });
  }
  public async removePreKey(
    currentAddress: Address,
    keyId: number
  ): Promise<void> {
    await this.graphql.mutate<
      RemovePreKeyMutation,
      RemovePreKeyMutationVariables
    >({
      mutation: RemovePreKeyDocument,
      variables: {
        deviceId: currentAddress.deviceId,
        keyId,
      },
    });
  }
  public async storeSignedPreKey(
    currentAddress: Address,
    keyId: number,
    pubKey: ArrayBuffer,
    signature: ArrayBuffer
  ): Promise<void> {
    const result = await this.graphql.mutate<
      StoreSignedPreKeyMutation,
      StoreSignedPreKeyMutationVariables
    >({
      mutation: StoreSignedPreKeyDocument,
      variables: {
        deviceId: currentAddress.deviceId,
        input: {
          keyId,
          pubKey: serializeKey(pubKey),
          signature: serializeKey(signature),
        },
      },
    });
  }
}
