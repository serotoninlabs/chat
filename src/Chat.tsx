import React, { useContext, useEffect, useMemo } from "react";
import { useSignal } from "./ChatProvider";

export interface ChatProps {
  myEthAccount: string;
  counterPartyEthAccount: string;
}

export const Chat: React.FC<ChatProps> = ({
  myEthAccount,
  counterPartyEthAccount,
}) => {
  const { signal, state } = useSignal();

  async function createIdentity() {
    signal.createIdentity(myEthAccount);
  }

  if (state.initialized && !state.registrationId) {
    return (
      <div>
        <button onClick={createIdentity}>Create Identity</button>
      </div>
    );
  } else if (state.initialized && state.registrationId) {
    return (
      <div>
        {state.registrationId}
        <br />
        <br />
        <button onClick={() => signal.encryptIdentity()}>
          encryptIdentity
        </button>
        <br />
        <button onClick={() => signal.startSession(counterPartyEthAccount)}>
          start session
        </button>
        <br />
      </div>
    );
  }

  return <div>loading {JSON.stringify(state)}</div>;
};
