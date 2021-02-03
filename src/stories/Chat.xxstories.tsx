import React from "react";
import { Story, Meta } from "@storybook/react";

import { Chat, ChatProps } from "../Chat";
import { ChatManager } from "../ChatManager";
import { ChatProvider } from "../ChatProvider";

const graphqlUri = "http://localhost:8080/query";

export default {
  title: "Example/Chat",
  component: Chat,
} as Meta;

const Template: Story<ChatProps> = (args) => {
  return (
    <ChatProvider authToken={args.myEthAccount} graphqlUri={graphqlUri}>
      <div>
        <Chat {...args} />
        <ChatManager {...args} />
      </div>
    </ChatProvider>
  );
};

export const Alice = Template.bind({});
Alice.args = {
  myEthAccount: "0x96091247C959F369fe9F8B4D2F416c839c638e70",
  counterPartyEthAccount: "0xcf0037d7c19Fb15C396666c85caC689772100645",
};

export const Bob = Template.bind({});
Bob.args = {
  myEthAccount: "0xcf0037d7c19Fb15C396666c85caC689772100645",
  counterPartyEthAccount: "0x96091247C959F369fe9F8B4D2F416c839c638e70",
};
