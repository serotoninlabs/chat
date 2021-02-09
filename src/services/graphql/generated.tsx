import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Time: any;
  BigInt: any;
  Upload: any;
  EthAddress: any;
};




export type Query = {
  __typename?: 'Query';
  hello?: Maybe<Scalars['String']>;
  conversation: Conversation;
  listings?: Maybe<Array<Listing>>;
  listing: Listing;
  listingBySlug: Listing;
  me: InternalUser;
  user: User;
};


export type QueryConversationArgs = {
  conversationId: Scalars['String'];
};


export type QueryListingsArgs = {
  filter: ListingFilter;
};


export type QueryListingArgs = {
  id: Scalars['String'];
};


export type QueryListingBySlugArgs = {
  username: Scalars['String'];
  slug: Scalars['String'];
};


export type QueryUserArgs = {
  username: Scalars['String'];
};



export enum ImageSize {
  Thumbnail = 'thumbnail',
  Original = 'original'
}

export type Mutation = {
  __typename?: 'Mutation';
  ping: Scalars['String'];
  signin: SigninResponse;
  setAvatar: InternalUser;
  updateProfile: InternalUser;
  conversationCreate: Conversation;
  listingSync: Listing;
  listingStart: Scalars['String'];
  listingUpdateRadicalMarket: ListingRadicalMarket;
  listingUpdateAuction: ListingAuction;
  listingUploadAsset: ListingAsset;
  listingDeleteAsset: ListingAsset;
  signalRegisterDevice: SignalRegisterDeviceResult;
  signalStorePreKeys: Scalars['Boolean'];
  signalStoreSignedPreKey: Scalars['Boolean'];
  signalRemovePreKey: Scalars['Boolean'];
  signalGeneratePreKeyBundle: SignalPreKeyBundle;
  signalSendMessage: Scalars['Boolean'];
  signalAcknowledgeMessages: Scalars['Boolean'];
};


export type MutationPingArgs = {
  input: Scalars['String'];
};


export type MutationSigninArgs = {
  input: SigninRequest;
};


export type MutationSetAvatarArgs = {
  file: Scalars['Upload'];
};


export type MutationUpdateProfileArgs = {
  profile: ProfileInput;
};


export type MutationConversationCreateArgs = {
  input: ConversationCreateInput;
};


export type MutationListingSyncArgs = {
  id: Scalars['String'];
};


export type MutationListingStartArgs = {
  listingType: ListingType;
};


export type MutationListingUpdateRadicalMarketArgs = {
  id: Scalars['String'];
  input: ListingRadicalMarketInput;
};


export type MutationListingUpdateAuctionArgs = {
  id: Scalars['String'];
  input: ListingAuctionInput;
};


export type MutationListingUploadAssetArgs = {
  input?: Maybe<ListingAssetInput>;
};


export type MutationListingDeleteAssetArgs = {
  input?: Maybe<ListingAssetInput>;
};


export type MutationSignalRegisterDeviceArgs = {
  input: SignalRegisterDeviceInput;
};


export type MutationSignalStorePreKeysArgs = {
  deviceId: Scalars['String'];
  input: Array<SignalPreKeyInput>;
};


export type MutationSignalStoreSignedPreKeyArgs = {
  deviceId: Scalars['String'];
  input: SignalSignedPreKeyInput;
};


export type MutationSignalRemovePreKeyArgs = {
  deviceId: Scalars['String'];
  keyId: Scalars['Int'];
};


export type MutationSignalGeneratePreKeyBundleArgs = {
  address: SignalAddressInput;
};


export type MutationSignalSendMessageArgs = {
  deviceId: Scalars['String'];
  recipient: SignalAddressInput;
  ciphertext: SignalEncryptedMessageInput;
};


export type MutationSignalAcknowledgeMessagesArgs = {
  deviceId: Scalars['String'];
  messageIds: Array<Scalars['String']>;
};

export type SignalRegisterDeviceInput = {
  userId: Scalars['String'];
  identityPublicKey: Scalars['String'];
  publicPreKeys: Array<SignalPreKeyInput>;
  signedPreKey: SignalSignedPreKeyInput;
};

export type Subscription = {
  __typename?: 'Subscription';
  signalMessages: Message;
};


export type SubscriptionSignalMessagesArgs = {
  deviceId: Scalars['String'];
};

export type ConversationCreateInput = {
  type?: Maybe<ConversationType>;
  userIds?: Maybe<Array<Scalars['String']>>;
};

export type SignalAddress = {
  __typename?: 'SignalAddress';
  userId: Scalars['String'];
  deviceId: Scalars['String'];
};

export type SignalPreKeyBundle = {
  __typename?: 'SignalPreKeyBundle';
  address: SignalAddress;
  registrationId: Scalars['Int'];
  identityKey: Scalars['String'];
  signedPreKey: SignalSignedPreKey;
  preKey: SignalPreKey;
};

export type User = {
  __typename?: 'User';
  id: Scalars['String'];
  profile: Profile;
  listings?: Maybe<Array<Listing>>;
};


export type UserListingsArgs = {
  filter?: Maybe<ListingFilter>;
};

export type SigninRequest = {
  challenge: Scalars['String'];
  signature: Scalars['String'];
  signer: Scalars['String'];
};

export type ListingAuctionData = {
  __typename?: 'ListingAuctionData';
  id: Scalars['String'];
  eventDateStart?: Maybe<Scalars['Time']>;
  eventDateEnd?: Maybe<Scalars['Time']>;
  endDate?: Maybe<Scalars['Time']>;
  startingPrice?: Maybe<Scalars['BigInt']>;
  purchasePrice?: Maybe<Scalars['BigInt']>;
  highestBidder?: Maybe<Scalars['EthAddress']>;
  highestBidderUser?: Maybe<User>;
  highestBid?: Maybe<Scalars['BigInt']>;
  closed?: Maybe<Scalars['Boolean']>;
};

export type SignalAddressInput = {
  userId: Scalars['String'];
  deviceId: Scalars['String'];
};

export type InternalUser = {
  __typename?: 'InternalUser';
  id: Scalars['String'];
  user: User;
  email?: Maybe<Scalars['String']>;
};

export type ListingRadicalMarketInput = {
  slug?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  brief?: Maybe<Scalars['String']>;
  content?: Maybe<Scalars['String']>;
  type?: Maybe<ListingType>;
  category?: Maybe<Scalars['String']>;
  topics?: Maybe<Array<Scalars['String']>>;
  channels?: Maybe<Array<Channels>>;
  creationTxId?: Maybe<Scalars['String']>;
  secondsPerEpoch?: Maybe<Scalars['Int']>;
  taxRatePerEpoch?: Maybe<Scalars['Int']>;
  transferCommission?: Maybe<Scalars['Int']>;
  evictionGracePeriod?: Maybe<Scalars['Int']>;
  minPrice?: Maybe<Scalars['BigInt']>;
  token?: Maybe<Scalars['EthAddress']>;
};

export type ListingAuction = Listing & {
  __typename?: 'ListingAuction';
  id: Scalars['String'];
  creatorUserId: Scalars['String'];
  creator: User;
  slug: Scalars['String'];
  title: Scalars['String'];
  brief: Scalars['String'];
  content: Scalars['String'];
  status: ListingStatus;
  type: ListingType;
  category: Scalars['String'];
  topics?: Maybe<Array<Scalars['String']>>;
  channels?: Maybe<Array<Channels>>;
  assets?: Maybe<Array<ListingAsset>>;
  creationTxId?: Maybe<Scalars['String']>;
  ethData?: Maybe<ListingEthData>;
  thumbnail?: Maybe<Scalars['String']>;
  auction?: Maybe<ListingAuctionData>;
};

export type Profile = {
  __typename?: 'Profile';
  id: Scalars['String'];
  avatar?: Maybe<Scalars['String']>;
  displayName: Scalars['String'];
  username: Scalars['String'];
  bio?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Scalars['String']>>;
  userType: UserType;
  content?: Maybe<Scalars['String']>;
  social?: Maybe<Social>;
};


export type ProfileAvatarArgs = {
  size?: Maybe<ImageSize>;
};

export type SigninResponse = {
  __typename?: 'SigninResponse';
  token: Scalars['String'];
  refreshToken: Scalars['String'];
  me: InternalUser;
};

export enum ConversationType {
  Broadcast = 'broadcast',
  Group = 'group',
  Dm = 'dm',
  Listing = 'listing'
}

export type ListingAssetInput = {
  listingId: Scalars['String'];
  name: Scalars['String'];
  contentType: Scalars['String'];
  size: Scalars['Int'];
  file: Scalars['Upload'];
};

export type SignalEncryptedMessageInput = {
  registrationId: Scalars['Int'];
  body: Scalars['String'];
  type: Scalars['Int'];
};

export enum Channels {
  Facebook = 'facebook',
  Instgram = 'instgram',
  Tiktok = 'tiktok',
  Twitter = 'twitter',
  Twitch = 'twitch',
  Website = 'website',
  Youtube = 'youtube',
  Podcast = 'podcast'
}

export type ListingAsset = {
  __typename?: 'ListingAsset';
  parent: Scalars['String'];
  name: Scalars['String'];
  contentType: Scalars['String'];
  size: Scalars['Int'];
  url: Scalars['String'];
};

export type Social = {
  __typename?: 'Social';
  facebook?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  instagram?: Maybe<Scalars['String']>;
  tiktok?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
};

export type Conversation = {
  __typename?: 'Conversation';
  id: Scalars['String'];
  adminUserIds: Array<Scalars['String']>;
  adminUsers: Array<User>;
  type?: Maybe<ConversationType>;
  memberUserIds: Array<Scalars['String']>;
  members: Array<User>;
  participants: Array<SignalAddress>;
};

export type ListingEthData = {
  __typename?: 'ListingEthData';
  id: Scalars['String'];
  controller: Scalars['EthAddress'];
  creator: Scalars['EthAddress'];
  owner?: Maybe<Scalars['EthAddress']>;
  ownerUser?: Maybe<User>;
  token: Scalars['EthAddress'];
  category: Scalars['String'];
};

export type ListingRadicalMarket = Listing & {
  __typename?: 'ListingRadicalMarket';
  id: Scalars['String'];
  creatorUserId: Scalars['String'];
  creator: User;
  slug: Scalars['String'];
  title: Scalars['String'];
  brief: Scalars['String'];
  content: Scalars['String'];
  status: ListingStatus;
  type: ListingType;
  category: Scalars['String'];
  topics?: Maybe<Array<Scalars['String']>>;
  channels?: Maybe<Array<Channels>>;
  assets?: Maybe<Array<ListingAsset>>;
  creationTxId?: Maybe<Scalars['String']>;
  ethData?: Maybe<ListingEthData>;
  thumbnail?: Maybe<Scalars['String']>;
  radicalMarket?: Maybe<ListingRadicalMarketData>;
};

export type SignalSignedPreKey = {
  __typename?: 'SignalSignedPreKey';
  keyId: Scalars['Int'];
  pubKey: Scalars['String'];
  signature: Scalars['String'];
};

export type Listing = {
  id: Scalars['String'];
  creatorUserId: Scalars['String'];
  creator: User;
  slug: Scalars['String'];
  title: Scalars['String'];
  brief: Scalars['String'];
  content: Scalars['String'];
  status: ListingStatus;
  type: ListingType;
  category: Scalars['String'];
  topics?: Maybe<Array<Scalars['String']>>;
  channels?: Maybe<Array<Channels>>;
  assets?: Maybe<Array<ListingAsset>>;
  creationTxId?: Maybe<Scalars['String']>;
  ethData?: Maybe<ListingEthData>;
  thumbnail?: Maybe<Scalars['String']>;
};

export type SignalRegisterDeviceResult = {
  __typename?: 'SignalRegisterDeviceResult';
  deviceId: Scalars['String'];
  registrationId: Scalars['Int'];
};

export type SocialInput = {
  facebook?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  instagram?: Maybe<Scalars['String']>;
  tiktok?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
};

export enum ListingType {
  Auction = 'auction',
  RadicalMarket = 'radicalMarket'
}


export type SignalPreKeyInput = {
  keyId: Scalars['Int'];
  pubKey: Scalars['String'];
};

export type ListingAuctionInput = {
  slug?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  brief?: Maybe<Scalars['String']>;
  content?: Maybe<Scalars['String']>;
  type?: Maybe<ListingType>;
  category?: Maybe<Scalars['String']>;
  topics?: Maybe<Array<Scalars['String']>>;
  channels?: Maybe<Array<Channels>>;
  token?: Maybe<Scalars['EthAddress']>;
  creationTxId?: Maybe<Scalars['String']>;
  eventStartDate?: Maybe<Scalars['Time']>;
  eventEndDate?: Maybe<Scalars['Time']>;
  startingPrice?: Maybe<Scalars['BigInt']>;
  purchasePrice?: Maybe<Scalars['BigInt']>;
  endDate?: Maybe<Scalars['Time']>;
};


export type SignalSignedPreKeyInput = {
  keyId: Scalars['Int'];
  pubKey: Scalars['String'];
  signature: Scalars['String'];
};

export type SignalPreKey = {
  __typename?: 'SignalPreKey';
  keyId: Scalars['Int'];
  pubKey: Scalars['String'];
};

export type ProfileInput = {
  displayName?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
  bio?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Scalars['String']>>;
  userType?: Maybe<UserType>;
  content?: Maybe<Scalars['String']>;
  social?: Maybe<SocialInput>;
  email?: Maybe<Scalars['String']>;
};

export type ListingFilter = {
  status?: Maybe<Scalars['String']>;
  owner?: Maybe<Scalars['String']>;
  creator?: Maybe<Scalars['String']>;
};

export type SignalCiphertext = {
  __typename?: 'SignalCiphertext';
  body: Scalars['String'];
  type: Scalars['Int'];
  registrationId: Scalars['Int'];
};

export enum ListingStatus {
  Draft = 'draft',
  Creating = 'creating',
  Open = 'open',
  AuctionExpired = 'auctionExpired',
  Closed = 'closed'
}

export type ListingRadicalMarketData = {
  __typename?: 'ListingRadicalMarketData';
  id: Scalars['String'];
  secondsPerEpoch?: Maybe<Scalars['Int']>;
  taxRatePerEpoch?: Maybe<Scalars['Int']>;
  transferCommission?: Maybe<Scalars['Int']>;
  evictionGracePeriod?: Maybe<Scalars['Int']>;
  minPrice?: Maybe<Scalars['BigInt']>;
  assessment?: Maybe<Scalars['BigInt']>;
  latestCollection?: Maybe<Scalars['Int']>;
  taxEscrowAmount?: Maybe<Scalars['BigInt']>;
  status?: Maybe<Scalars['String']>;
};

export type SignalSignedKeyPair = {
  __typename?: 'SignalSignedKeyPair';
  keyId: Scalars['Int'];
  pubKey: Scalars['String'];
  signature: Scalars['String'];
};

export type Message = {
  __typename?: 'Message';
  receiptId: Scalars['String'];
  sender: SignalAddress;
  ciphertext: SignalCiphertext;
};

export enum UserType {
  Creator = 'creator',
  Sponsor = 'sponsor',
  Unspecified = 'unspecified'
}

export type AcknowledgeMessagesMutationVariables = Exact<{
  deviceId: Scalars['String'];
  messageIds: Array<Scalars['String']> | Scalars['String'];
}>;


export type AcknowledgeMessagesMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'signalAcknowledgeMessages'>
);

export type GeneratePreKeyBundleMutationVariables = Exact<{
  address: SignalAddressInput;
}>;


export type GeneratePreKeyBundleMutation = (
  { __typename?: 'Mutation' }
  & { signalGeneratePreKeyBundle: (
    { __typename?: 'SignalPreKeyBundle' }
    & Pick<SignalPreKeyBundle, 'registrationId' | 'identityKey'>
    & { address: (
      { __typename?: 'SignalAddress' }
      & Pick<SignalAddress, 'userId' | 'deviceId'>
    ), signedPreKey: (
      { __typename?: 'SignalSignedPreKey' }
      & Pick<SignalSignedPreKey, 'keyId' | 'pubKey' | 'signature'>
    ), preKey: (
      { __typename?: 'SignalPreKey' }
      & Pick<SignalPreKey, 'keyId' | 'pubKey'>
    ) }
  ) }
);

export type GetConversationQueryVariables = Exact<{
  conversationId: Scalars['String'];
}>;


export type GetConversationQuery = (
  { __typename?: 'Query' }
  & { conversation: (
    { __typename?: 'Conversation' }
    & Pick<Conversation, 'id' | 'adminUserIds' | 'type'>
    & { members: Array<(
      { __typename?: 'User' }
      & Pick<User, 'id'>
      & { profile: (
        { __typename?: 'Profile' }
        & Pick<Profile, 'username' | 'avatar'>
      ) }
    )>, participants: Array<(
      { __typename?: 'SignalAddress' }
      & Pick<SignalAddress, 'userId' | 'deviceId'>
    )> }
  ) }
);

export type OnMessageAddedSubscriptionVariables = Exact<{
  deviceId: Scalars['String'];
}>;


export type OnMessageAddedSubscription = (
  { __typename?: 'Subscription' }
  & { signalMessages: (
    { __typename?: 'Message' }
    & Pick<Message, 'receiptId'>
    & { sender: (
      { __typename?: 'SignalAddress' }
      & Pick<SignalAddress, 'userId' | 'deviceId'>
    ), ciphertext: (
      { __typename?: 'SignalCiphertext' }
      & Pick<SignalCiphertext, 'body' | 'type' | 'registrationId'>
    ) }
  ) }
);

export type RegisterDeviceMutationVariables = Exact<{
  input: SignalRegisterDeviceInput;
}>;


export type RegisterDeviceMutation = (
  { __typename?: 'Mutation' }
  & { signalRegisterDevice: (
    { __typename?: 'SignalRegisterDeviceResult' }
    & Pick<SignalRegisterDeviceResult, 'deviceId' | 'registrationId'>
  ) }
);

export type RemovePreKeyMutationVariables = Exact<{
  deviceId: Scalars['String'];
  keyId: Scalars['Int'];
}>;


export type RemovePreKeyMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'signalRemovePreKey'>
);

export type SendMessageMutationVariables = Exact<{
  deviceId: Scalars['String'];
  recipient: SignalAddressInput;
  ciphertext: SignalEncryptedMessageInput;
}>;


export type SendMessageMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'signalSendMessage'>
);

export type StorePreKeysMutationVariables = Exact<{
  deviceId: Scalars['String'];
  input: Array<SignalPreKeyInput> | SignalPreKeyInput;
}>;


export type StorePreKeysMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'signalStorePreKeys'>
);

export type StoreSignedPreKeyMutationVariables = Exact<{
  deviceId: Scalars['String'];
  input: SignalSignedPreKeyInput;
}>;


export type StoreSignedPreKeyMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'signalStoreSignedPreKey'>
);


export const AcknowledgeMessagesDocument = gql`
    mutation AcknowledgeMessages($deviceId: String!, $messageIds: [String!]!) {
  signalAcknowledgeMessages(deviceId: $deviceId, messageIds: $messageIds)
}
    `;
export type AcknowledgeMessagesMutationFn = Apollo.MutationFunction<AcknowledgeMessagesMutation, AcknowledgeMessagesMutationVariables>;
export type AcknowledgeMessagesMutationResult = Apollo.MutationResult<AcknowledgeMessagesMutation>;
export type AcknowledgeMessagesMutationOptions = Apollo.BaseMutationOptions<AcknowledgeMessagesMutation, AcknowledgeMessagesMutationVariables>;
export const GeneratePreKeyBundleDocument = gql`
    mutation GeneratePreKeyBundle($address: SignalAddressInput!) {
  signalGeneratePreKeyBundle(address: $address) {
    address {
      userId
      deviceId
    }
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
    `;
export type GeneratePreKeyBundleMutationFn = Apollo.MutationFunction<GeneratePreKeyBundleMutation, GeneratePreKeyBundleMutationVariables>;
export type GeneratePreKeyBundleMutationResult = Apollo.MutationResult<GeneratePreKeyBundleMutation>;
export type GeneratePreKeyBundleMutationOptions = Apollo.BaseMutationOptions<GeneratePreKeyBundleMutation, GeneratePreKeyBundleMutationVariables>;
export const GetConversationDocument = gql`
    query GetConversation($conversationId: String!) {
  conversation(conversationId: $conversationId) {
    id
    adminUserIds
    type
    members {
      id
      profile {
        username
        avatar
      }
    }
    participants {
      userId
      deviceId
    }
  }
}
    `;
export type GetConversationQueryResult = Apollo.QueryResult<GetConversationQuery, GetConversationQueryVariables>;
export const OnMessageAddedDocument = gql`
    subscription OnMessageAdded($deviceId: String!) {
  signalMessages(deviceId: $deviceId) {
    receiptId
    sender {
      userId
      deviceId
    }
    ciphertext {
      body
      type
      registrationId
    }
  }
}
    `;
export type OnMessageAddedSubscriptionResult = Apollo.SubscriptionResult<OnMessageAddedSubscription>;
export const RegisterDeviceDocument = gql`
    mutation RegisterDevice($input: SignalRegisterDeviceInput!) {
  signalRegisterDevice(input: $input) {
    deviceId
    registrationId
  }
}
    `;
export type RegisterDeviceMutationFn = Apollo.MutationFunction<RegisterDeviceMutation, RegisterDeviceMutationVariables>;
export type RegisterDeviceMutationResult = Apollo.MutationResult<RegisterDeviceMutation>;
export type RegisterDeviceMutationOptions = Apollo.BaseMutationOptions<RegisterDeviceMutation, RegisterDeviceMutationVariables>;
export const RemovePreKeyDocument = gql`
    mutation RemovePreKey($deviceId: String!, $keyId: Int!) {
  signalRemovePreKey(deviceId: $deviceId, keyId: $keyId)
}
    `;
export type RemovePreKeyMutationFn = Apollo.MutationFunction<RemovePreKeyMutation, RemovePreKeyMutationVariables>;
export type RemovePreKeyMutationResult = Apollo.MutationResult<RemovePreKeyMutation>;
export type RemovePreKeyMutationOptions = Apollo.BaseMutationOptions<RemovePreKeyMutation, RemovePreKeyMutationVariables>;
export const SendMessageDocument = gql`
    mutation SendMessage($deviceId: String!, $recipient: SignalAddressInput!, $ciphertext: SignalEncryptedMessageInput!) {
  signalSendMessage(
    deviceId: $deviceId
    recipient: $recipient
    ciphertext: $ciphertext
  )
}
    `;
export type SendMessageMutationFn = Apollo.MutationFunction<SendMessageMutation, SendMessageMutationVariables>;
export type SendMessageMutationResult = Apollo.MutationResult<SendMessageMutation>;
export type SendMessageMutationOptions = Apollo.BaseMutationOptions<SendMessageMutation, SendMessageMutationVariables>;
export const StorePreKeysDocument = gql`
    mutation StorePreKeys($deviceId: String!, $input: [SignalPreKeyInput!]!) {
  signalStorePreKeys(deviceId: $deviceId, input: $input)
}
    `;
export type StorePreKeysMutationFn = Apollo.MutationFunction<StorePreKeysMutation, StorePreKeysMutationVariables>;
export type StorePreKeysMutationResult = Apollo.MutationResult<StorePreKeysMutation>;
export type StorePreKeysMutationOptions = Apollo.BaseMutationOptions<StorePreKeysMutation, StorePreKeysMutationVariables>;
export const StoreSignedPreKeyDocument = gql`
    mutation StoreSignedPreKey($deviceId: String!, $input: SignalSignedPreKeyInput!) {
  signalStoreSignedPreKey(deviceId: $deviceId, input: $input)
}
    `;
export type StoreSignedPreKeyMutationFn = Apollo.MutationFunction<StoreSignedPreKeyMutation, StoreSignedPreKeyMutationVariables>;
export type StoreSignedPreKeyMutationResult = Apollo.MutationResult<StoreSignedPreKeyMutation>;
export type StoreSignedPreKeyMutationOptions = Apollo.BaseMutationOptions<StoreSignedPreKeyMutation, StoreSignedPreKeyMutationVariables>;