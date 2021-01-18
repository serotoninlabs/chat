import React, { useReducer, useCallback } from "react";
import {
  gql,
  OnSubscriptionDataOptions,
  useSubscription,
} from "@apollo/client";
import { useSignal } from "./ChatProvider";
import { MessageInput } from "./MessageInput";
import { ChatMessage, ChatMessageComponent } from "./ChatMessage";

const MESSAGES_SUBSCRIPTION = gql`
  subscription OnMessageAdded($sender: String!) {
    signalMessages(sender: $sender) {
      ciphertext {
        body
        type
        registrationId
      }
    }
  }
`;

export interface ReducerState {
  messages: ChatMessage[];
}
type NewMessageAction = {
  type: "new-message";
  message: ChatMessage;
};

type Actions = NewMessageAction;
function reducer(state: ReducerState, action: Actions): ReducerState {
  switch (action.type) {
    case "new-message":
      return { ...state, messages: state.messages.concat(action.message) };
    default:
      return state;
  }
}

const initialState: ReducerState = { messages: [] };

export interface ChatWindowProps {
  myEthAccount: string;
  counterPartyEthAccount: string;
}
export const ChatWindow: React.FC<ChatWindowProps> = ({
  myEthAccount,
  counterPartyEthAccount,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { signal } = useSignal();
  const onSubscriptionData = useCallback(
    async (opts: OnSubscriptionDataOptions<any>) => {
      console.log("got data", opts);
      let ciphertext = opts.subscriptionData.data.signalMessages.ciphertext;
      let plaintext = "";

      console.log("decrypting ciphertext", ciphertext);
      plaintext = await signal.decrypt(counterPartyEthAccount, 0, ciphertext);

      dispatch({
        type: "new-message",
        message: {
          direction: "receive",
          plaintext,
        },
      });
    },
    [signal]
  );
  const { error, loading, data } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { sender: counterPartyEthAccount },
    shouldResubscribe: true,
    onSubscriptionData,
  });
  if (error) {
    return <div>error: {JSON.stringify(error)}</div>;
  }
  console.log("chat window render", data);
  return (
    <div>
      <h3>Chat</h3>

      {state.messages.map((m, idx) => {
        return <ChatMessageComponent key={idx} message={m} />;
      })}
      <MessageInput
        recipientUserId={counterPartyEthAccount}
        onMessageSend={(plaintext) =>
          dispatch({
            type: "new-message",
            message: {
              direction: "send",
              plaintext,
            },
          })
        }
      />
    </div>
  );
  // return <h4>New comment: {!loading && JSON.stringify(data)}</h4>;
};
