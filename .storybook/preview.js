import { ChatProvider } from "../src/ChatProvider";
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
};

export const decorators = [(Story) => <Story />];
