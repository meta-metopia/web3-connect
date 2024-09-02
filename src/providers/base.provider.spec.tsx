import { ethers } from "ethers";
import { BaseProvider } from "./base.provider";
import { EIP1193Provider } from "./provider.interface";

describe("BaseProvider", () => {
  let walletProvider: BaseProvider;
  let mockEip1193Provider: EIP1193Provider;
  let wallet: ethers.HDNodeWallet;

  beforeAll(() => {
    wallet = ethers.Wallet.createRandom();
    mockEip1193Provider = {
      request: async (request: {
        method: string;
        params?: Array<any>;
      }): Promise<any> => {
        if (request.method === "eth_accounts") {
          return [wallet.address];
        }

        if (request.method === "eth_getBalance") {
          return "0x0";
        }

        if (request.method === "eth_requestAccounts") {
          return [wallet.address];
        }

        if (request.method === "eth_chainId") {
          return 1;
        }

        if (request.method === "wallet_switchEthereumChain") {
          return true;
        }

        if (request.method === "personal_sign") {
          // use ethers to sign the message
          const message = request.params![0];
          const signedMessage = await wallet.signMessage(message);
          return signedMessage;
        }
      },
      send: jest.fn(),
      on: function (): void {},
    };
  });

  beforeEach(() => {
    walletProvider = new BaseProvider({} as any);
    walletProvider.provider = mockEip1193Provider;
  });

  it("should return the wallet address", async () => {
    const address = await walletProvider.getWalletAddress();
    expect(address).toBe(wallet.address);
  });

  it("should check if is enabled", () => {
    expect(walletProvider.isEnabled()).toBe(true);
  });

  it("should not enable if no provider provided", () => {
    const walletProvider = new BaseProvider({} as any);
    expect(walletProvider.isEnabled()).toBe(false);
  });

  it("should return the provider", () => {
    expect(walletProvider.getProvider()).toBe(mockEip1193Provider);
  });

  it("should be able to connect", async () => {
    const address = await walletProvider.connect();
    expect(address.walletAddress).toBe(wallet.address);
    expect(address.action).toBe("continue");
  });

  it("should not connect if no provider provided", async () => {
    const walletProvider = new BaseProvider({} as any);
    await expect(() => walletProvider.connect()).rejects.toThrow(
      "Provider not found",
    );
  });

  it("should be able to sign and verify a message", async () => {
    const message = "test message";
    const signedMessage = await walletProvider.signMessage(message, {
      forAuthentication: true,
    });

    expect(signedMessage).toBeDefined();

    const verifiedMessage = await walletProvider.verifyMessage(
      message,
      signedMessage,
      wallet.address,
    );
    expect(verifiedMessage).toBeTruthy();
  });

  it("should not sign if no provider provided", async () => {
    const walletProvider = new BaseProvider({} as any);
    await expect(() =>
      walletProvider.signMessage("test message", { forAuthentication: true }),
    ).rejects.toThrow("Provider not found");
  });

  it("should be able to switch network", async () => {
    await walletProvider.switchNetwork(1, "http://localhost:8545", false);
  });

  it("should be able to switch network", async () => {
    await walletProvider.switchNetwork(1, "http://localhost:8545", true);
  });

  it("should be able to get chain id", async () => {
    const chainId = await walletProvider.chainId();
    expect(chainId).toBe(1);
  });

  it("should be able to get balance", async () => {
    const balance = await walletProvider.getBalance();
    expect(balance).toBe("0x0");
  });

  it("should be able to disconnect", async () => {
    await walletProvider.disconnect();
  });

  // eslint-disable-next-line
  it("should be able to onAccountChange", async () => {
    walletProvider.onAccountsChanged(() => {});
  });

  // eslint-disable-next-line
  it("should be able to onChainChange", async () => {
    walletProvider.onChainChanged(() => {});
  });

  // eslint-disable-next-line
  it("should be able to init", async () => {
    walletProvider.init();
  });
});
