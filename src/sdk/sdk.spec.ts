import { Sdk } from "./sdk";

describe("Test SDK", () => {
  describe("Should be able to register providers", () => {
    it("should be able to register a provider", () => {
      const sdk = new Sdk([], {} as any, {} as any);
      const provider = {
        metadata: {
          name: "test",
          description: "test",
        },
        init: jest.fn(),
      };

      sdk.registerProvider(provider as any);
      expect(sdk.walletProviders).toContain(provider);

      const provider2WithSameName = {
        metadata: {
          name: "test",
          description: "test2",
        },
        init: jest.fn(),
      };

      sdk.registerProvider(provider2WithSameName as any);
      expect(sdk.walletProviders).toContain(provider2WithSameName);
      expect(sdk.walletProviders).not.toContain(provider);
      expect(sdk.walletProviders.length).toBe(1);
    });
  });
});
