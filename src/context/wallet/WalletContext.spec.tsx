/**
 * @jest-environment jsdom
 */

import { TextDecoder, TextEncoder } from "util";

// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    setSubject: jest.fn().mockReturnThis(),
    setPayload: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("token"),
  })),
}));

jest.mock("@web3modal/ethers", () => ({
  Web3Modal: jest.fn(),
  Web3ModalOptions: jest.fn(),
  createWeb3Modal: jest.fn(),
}));

jest.mock("@solana/web3.js", () => ({
  Keypair: {
    generate: jest.fn(),
    fromSecretKey: jest.fn(),
  },
  PublicKey: jest.fn(),
}));

import { render, screen, waitFor } from "@testing-library/react";
import { EnvironmentContextProvider } from "../environment/EnvironmentContext";
import { WalletContextProvider } from "./WalletContext";
import "@testing-library/jest-dom";
import {
  DesktopWithMetaMaskEnvironment,
  DesktopWithOKXEnvironment,
  MobileBrowserEnvironment,
  MobileMetaMaskEnvironment,
  MobileOKXEnvironment,
} from "../../test";

//TODO: skip ui test for now
describe.skip("WalletContext", () => {
  const walletAddress = "0x6681f8c4cbb47d2acef7afca40c242d5dc56faa9";
  const testCases = [
    {
      name: "should be able to connect to the wallet in desktop mode (MetaMask)",
      environment: DesktopWithMetaMaskEnvironment,
      inDocument: ["wallet-option-MetaMask", "wallet-option-OKX", "test"],
      notInDocument: ["wallet-option-WalletConnect", "wallet-option-InApp"],
    },
    {
      name: "should be able to connect to the wallet in desktop mode (OKX)",
      environment: DesktopWithOKXEnvironment,
      inDocument: ["wallet-option-MetaMask", "wallet-option-OKX", "test"],
      notInDocument: ["wallet-option-WalletConnect", "wallet-option-InApp"],
    },
    {
      name: "should be able to connect to the wallet in mobile mode (browser)",
      environment: MobileBrowserEnvironment,
      inDocument: ["test"],
      notInDocument: [
        "wallet-option-WalletConnect",
        "wallet-option-MetaMask",
        "wallet-option-OKX",
        "wallet-option-InApp",
      ],
    },
    {
      name: "should be able to connect to the wallet in mobile mode (metamask)",
      environment: MobileMetaMaskEnvironment,
      inDocument: ["test", "wallet-option-InApp"],
      notInDocument: [
        "wallet-option-WalletConnect",
        "wallet-option-MetaMask",
        "wallet-option-OKX",
      ],
    },
    {
      name: "should be able to connect to the wallet in mobile mode (OKX)",
      environment: MobileOKXEnvironment,
      inDocument: ["test", "wallet-option-OKX"],
      notInDocument: [
        "wallet-option-WalletConnect",
        "wallet-option-MetaMask",
        "wallet-option-InApp",
      ],
    },
  ];

  it.each(testCases)(
    "$name",
    async ({ environment, inDocument, notInDocument }) => {
      let window;

      if (environment.globalWindow) {
        window = await environment.globalWindow();
      }

      render(
        <EnvironmentContextProvider
          isMobile={environment.isMobileDevice}
          isTest={true}
          defaultWindow={window}
        >
          <WalletContextProvider
            session={{
              isAuth: true,
              walletAddress: walletAddress,
              provider: "MetaMask",
            }}
            onSignedOut={async () => {}}
            providers={[]}
          >
            <div data-testid="test">Test</div>
          </WalletContextProvider>
        </EnvironmentContextProvider>,
      );

      await waitFor(() => {
        inDocument.forEach((id) => {
          expect(screen.queryByTestId(id)).toBeInTheDocument();
        });

        notInDocument.forEach((id) => {
          expect(screen.queryByTestId(id)).not.toBeInTheDocument();
        });
      });
    },
  );

  describe("OnChainChanged and onAccountChanged", () => {
    let mockProvider: any;
    const original = window.location;
    const reloadFn = jest.fn();

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: {
          reload: reloadFn,
        },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        value: original,
      });
      jest.clearAllMocks();
    });

    it("should trigger window.location.reload when chainId changes", async () => {
      // spy on window.location.reload

      mockProvider = jest.fn().mockImplementation(() => ({
        metadata: {
          name: "test",
        },
        isEnabled: jest.fn().mockReturnValue(true),
        isVisible: jest.fn().mockReturnValue(true),
        getWalletAddress: jest.fn(() => walletAddress),
        chainId: jest.fn().mockReturnValue(1),
        onAccountsChanged: jest.fn(),
        onChainChanged: jest.fn((callback) => callback(2)),
        init: jest.fn(),
      }));

      render(
        <EnvironmentContextProvider
          isMobile={false}
          isTest={true}
          defaultWindow={window}
        >
          <WalletContextProvider
            providers={[mockProvider]}
            onSignedOut={async () => {}}
            session={{
              isAuth: true,
              walletAddress: walletAddress,
              provider: "test" as any,
            }}
          >
            <button />
          </WalletContextProvider>
        </EnvironmentContextProvider>,
      );

      await waitFor(() => {
        expect(mockProvider.onChainChanged).toHaveBeenCalledTimes(1);
        expect(reloadFn).toHaveBeenCalledTimes(1);
      });
    });

    it("should trigger window.location.reload when chainId changes", async () => {
      // spy on window.location.reload
      mockProvider = {
        metadata: {
          name: "test",
        },
        isEnabled: jest.fn().mockReturnValue(true),
        isVisible: jest.fn().mockReturnValue(true),
        getWalletAddress: jest.fn(() => walletAddress),
        chainId: jest.fn().mockReturnValue(1),
        onAccountsChanged: jest.fn((callback) => callback(2)),
        onChainChanged: jest.fn(),
        init: jest.fn(),
      } as any;

      render(
        <EnvironmentContextProvider
          isMobile={false}
          isTest={true}
          defaultWindow={window}
        >
          <WalletContextProvider
            providers={[mockProvider]}
            session={{
              isAuth: true,
              walletAddress: walletAddress,
              provider: "test" as any,
            }}
            onSignedOut={async () => {}}
          >
            <button />
          </WalletContextProvider>
        </EnvironmentContextProvider>,
      );

      await waitFor(() => {
        expect(mockProvider.onAccountsChanged).toHaveBeenCalledTimes(1);
        expect(reloadFn).toHaveBeenCalledTimes(1);
      });
    });
  });
});
