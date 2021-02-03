import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";

import {
  ApolloClient,
  createHttpLink,
  split,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
import { WebSocketLink } from "@apollo/client/link/ws";

import { SignalService, SignalState } from "./SignalServiceOld";

export interface ChatContextType {
  signal: SignalService;
  state: SignalState;
}
// @ts-ignore
export const ChatContext = React.createContext<ChatContextType>({});

export interface ChatProviderProps {
  graphqlUri: string;
  authToken?: string;
}
export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  graphqlUri,
  authToken,
}) => {
  const getAuth = useCallback(() => {
    return authToken;
  }, []);
  const graphql = useMemo(() => buildGraphql(graphqlUri, getAuth), [
    graphqlUri,
  ]);
  const signal = useMemo(() => new SignalService(graphql), [graphqlUri]);
  const [state, setState] = useState<SignalState>(signal.getState());
  useEffect(() => {
    signal.onStateChange(setState);
    signal.initialize();
  }, []);

  return (
    <ApolloProvider client={graphql}>
      <ChatContext.Provider value={{ signal, state }}>
        {children}
      </ChatContext.Provider>
    </ApolloProvider>
  );
};

export function useSignal(): ChatContextType {
  return useContext(ChatContext);
}

function buildGraphql(
  graphqlUri: string,
  getAuthToken: () => string | undefined
) {
  const httpLink = createHttpLink({
    uri: graphqlUri,
  });
  const wsLink = new WebSocketLink({
    uri: graphqlUri.replace("http", "ws"),
    options: {
      reconnect: true,
      connectionParams: () => ({
        Authorization: getAuthToken(),
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

  const authLink = setContext((_, { headers }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("not authorized to use graphql");
    }
    return {
      headers: {
        ...headers,
        authorization: token ? `${token}` : "",
      },
    };
  });

  return new ApolloClient({
    link: authLink.concat(splitLink),
    cache: new InMemoryCache(),
  });
}
