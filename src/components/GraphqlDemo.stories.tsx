import { Meta } from "@storybook/react";
import styled from "styled-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ApolloClient,
  split,
  InMemoryCache,
  createHttpLink,
  ApolloProvider,
  NormalizedCacheObject,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
import { WebSocketLink } from "@apollo/client/link/ws";

import { ChatManager } from "./ChatManager";
import { ManagedChatWindow } from "./ManagedChatWindow";
import { ChatService } from "../services/ChatService";
import { GraphqlRemoteService } from "../services/GraphqlRemoteService";
import {
  InvertedButton,
  Loading,
  PrimaryButton,
  SmallText,
  TextInput,
} from "@serotonin/components/dist/module";
import { ChatWindow } from "./ChatWindow";
import { SignalService } from "../services/SignalService";
import { ChatMessageProps } from "./MessageContainer";

export default {
  title: "Chat/Graphql",
} as Meta;

const Panel = styled.div``;
const Container = styled.div`
  display: flex;
  flex-direction: row;
  ${Panel} {
    width: 280px;
    margin: 0 30px;
    height: 600px;
    > *:nth-child(2) {
      border: 1px solid #e5e5e5;
    }
  }
`;

const conversationId = "test";
const tokens = {
  "0x14e62843CF576e68d5eEE9B5CDe8F5ee085D53e5":
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjEifQ.eyJleHAiOjE2MTI4MDMxMTMsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCIsIm5iZiI6MTYxMjcxNjcxMywic3ViIjoiMHgxNGU2Mjg0M0NGNTc2ZTY4ZDVlRUU5QjVDRGU4RjVlZTA4NUQ1M2U1In0.1GqwwJ4EokVIasa4BS1psLJ_NFoKWItlSePCn40BdhFYIPW7gOoGlN20o_Tr6zS3B2eBM2ulvbnI9aImauIQvw",
  "0xcf0037d7c19Fb15C396666c85caC689772100645":
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjEifQ.eyJleHAiOjE2MTI4MDQwMDcsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCIsIm5iZiI6MTYxMjcxNzYwNywic3ViIjoiMHhjZjAwMzdkN2MxOUZiMTVDMzk2NjY2Yzg1Y2FDNjg5NzcyMTAwNjQ1In0.BD3fj8r9YO90dOaAEeoRIEmIAye3Z8kJxR8LbWkZ7LN87NXe9vLsHbhY2HLiYT8nQ-sVuJKxNUgxa-hG7ou_Zw",
};

const MessageOverride: React.FC<ChatMessageProps> = (props) => {
  return <div>{props.message.content}</div>;
};

export const GraphqlDemo = () => {
  const [users, setUsers] = useState<string[]>([]);
  const addUser = useCallback(() => {
    setUsers([...users, "x"]);
  }, [users]);
  return (
    <div>
      <PrimaryButton onClick={addUser}>Add User</PrimaryButton>
      <Container>
        {Object.keys(tokens).map((userId) => {
          const token = tokens[userId];
          return (
            <UserPanel
              conversationId={conversationId}
              userId={userId}
              token={token}
              graphqlUri="http://localhost:8080/query"
            />
          );
        })}
      </Container>
    </div>
  );
};

type UserPanelConfig = {
  userId: string;
  token: string;
  conversationId: string;
  graphqlUri: string;
};

const UserPanel: React.FC<UserPanelConfig> = ({
  userId,
  token,
  conversationId,
  graphqlUri,
}) => {
  const [service, setService] = useState<ChatService>();
  const [loading, setLoading] = useState<boolean>(true);
  useMemo(async () => {
    const apolloClient = buildGraphql(graphqlUri, token);
    const remoteService = new GraphqlRemoteService(apolloClient);
    const signalService = await SignalService.build(remoteService, userId);
    const newService = await ChatService.build(
      signalService,
      remoteService,
      userId
    );
    setService(newService);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  return (
    <ChatManager service={service}>
      <Panel>
        <SmallText>{userId}</SmallText>
        <ManagedChatWindow conversationId={conversationId} />
      </Panel>
    </ChatManager>
  );
};

function buildGraphql(
  graphqlUri: string,
  token: string
): ApolloClient<NormalizedCacheObject> {
  const httpLink = createHttpLink({
    uri: graphqlUri,
  });

  const authLink = setContext(async (_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: token,
      },
    };
  });

  const wsLink = new WebSocketLink({
    uri: graphqlUri.replace("http", "ws"),
    options: {
      reconnect: true,
      connectionParams: () => ({
        Authorization: token,
      }),
    },
  });

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    httpLink
  );

  return new ApolloClient({
    link: authLink.concat(splitLink),
    cache: new InMemoryCache(),
  });
}
