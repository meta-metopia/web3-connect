import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import {
  DesktopWithMetaMaskEnvironment,
  DesktopWithOKXEnvironment,
  MobileBrowserEnvironment,
  MobileMetaMaskEnvironment,
  MobileOKXEnvironment,
} from "../../test";
import { OKXProvider } from "./okx.provider";

describe("OKX Provider test", () => {
  const testCases = [
    {
      name: "should show OKX provider in desktop browser and not installed",
      mockEnvironment: DesktopWithMetaMaskEnvironment,
      expectedEnabled: false,
      expectedVisible: true,
      expectedProvider: false,
    },
    {
      name: "should show OKX provider in desktop browser and installed",
      mockEnvironment: DesktopWithOKXEnvironment,
      expectedEnabled: true,
      expectedVisible: true,
      expectedProvider: true,
    },
    {
      name: "should not show OKX provider in mobile browser",
      mockEnvironment: MobileBrowserEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should not show OKX provider in Mobile MetaMask",
      mockEnvironment: MobileMetaMaskEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should show OKX provider in Mobile OKX wallet",
      mockEnvironment: MobileOKXEnvironment,
      expectedEnabled: true,
      expectedVisible: true,
      expectedProvider: true,
    },
  ];

  it.each(testCases)(
    "$name",
    async ({
      mockEnvironment,
      expectedEnabled,
      expectedVisible,
      expectedProvider,
    }) => {
      const provider = new OKXProvider(await mockEnvironment.globalWindow!());
      provider.init();
      expect(provider.isEnabled()).toBe(expectedEnabled);
      expect(provider.isVisible(mockEnvironment.isMobileDevice)).toBe(
        expectedVisible,
      );
      if (expectedProvider) {
        expect(provider.provider).toBeDefined();
      }
    },
  );

  describe("sign message", () => {
    let walletProvider: OKXProvider;
    let walletAddress: string;
    beforeEach(() => {
      const solanaKeypair = Keypair.fromSecretKey(
        Uint8Array.from([
          174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31,
          56, 222, 53, 138, 189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251,
          237, 246, 15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141,
          89, 240, 121, 121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109,
          168, 89, 238, 135,
        ]),
      );
      walletAddress = solanaKeypair.publicKey.toString();

      walletProvider = new OKXProvider({
        okxwallet: {
          solana: {
            connect: async () => {
              return {
                publicKey: solanaKeypair.publicKey,
              };
            },
            signMessage: async (messageBytes: Uint8Array) => {
              const signatures = nacl.sign.detached(
                messageBytes,
                solanaKeypair.secretKey,
              );
              return {
                signature: signatures,
              };
            },
          },
        },
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as any);
    });
    it("should be able to sign and verify a message on Solana", async () => {
      const message = "test message";
      const signedMessage = await walletProvider.signMessage(message, {
        forAuthentication: true,
        chain: "solana",
      });

      expect(signedMessage).toBeDefined();

      const verifiedMessage = await walletProvider.verifyMessage({
        message,
        signature: signedMessage,
        walletAddress: walletAddress,
        chain: "solana",
      });
      expect(verifiedMessage).toBeTruthy();
    });
  });
});
