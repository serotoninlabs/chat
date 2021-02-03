import { SerotoninProvider } from "@serotonin/components";
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
};

export const decorators = [
  (Story) => (
    <SerotoninProvider
      requiredChainId={4}
      magicApiKey="pk_test_EA065FCFB2F28E01"
    >
      <Story />
    </SerotoninProvider>
  ),
];
