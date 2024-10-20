import { Keypair } from "@solana/web3.js";
import { ethers } from "ethers";
import nacl from "tweetnacl";
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

        if (request.method === "eth_sendTransaction") {
          const txParams = request.params![0];
          // Mock a transaction hash
          return "0x" + "1".repeat(64);
        }

        if (request.method === "eth_getTransactionReceipt") {
          return {
            status: "0x1",
          };
        }

        if (request.method === "eth_call") {
          // Mock a successful contract call
          return "0x0000000000000000000000000000000000000000000000000000000000000001";
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
    const solanaKeypair = Keypair.fromSecretKey(
      Uint8Array.from([
        174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31,
        56, 222, 53, 138, 189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251,
        237, 246, 15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141,
        89, 240, 121, 121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109,
        168, 89, 238, 135,
      ]),
    );

    walletProvider = new BaseProvider({
      okxwallet: {
        solana: {
          connect: async () => wallet.address,
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
    } as any);
    walletProvider.provider = mockEip1193Provider;
  });

  it("should return the wallet address", async () => {
    const [address] = await walletProvider.getWalletAddress();
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

  it("should be able to sign and verify a message on Ethereum", async () => {
    const message = "test message";
    const signedMessage = await walletProvider.signMessage(message, {
      forAuthentication: true,
    });

    expect(signedMessage).toBeDefined();

    const verifiedMessage = await walletProvider.verifyMessage({
      message,
      signature: signedMessage,
      walletAddress: wallet.address,
    });
    expect(verifiedMessage).toBeTruthy();
  });

  it("should not sign if no provider provided", async () => {
    const walletProvider = new BaseProvider({} as any);
    await expect(() =>
      walletProvider.signMessage("test message", { forAuthentication: true }),
    ).rejects.toThrow("Provider not found");
  });

  it("should be able to switch network", async () => {
    await walletProvider.switchNetwork(1);
  });

  it("should be able to switch network", async () => {
    await walletProvider.switchNetwork(1);
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

  it("should be able to send a transaction", async () => {
    const to = "0x1234567890123456789012345678901234567890";
    const value = "1000000000000000000"; // 1 ETH in wei
    const data = "0x";

    const txHash = await walletProvider.sendTransaction({
      to,
      value,
      data,
    });

    expect(txHash).toBeDefined();
    expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it("should throw an error when sending a transaction without a provider", async () => {
    const walletProviderWithoutProvider = new BaseProvider({} as any);

    await expect(
      walletProviderWithoutProvider.sendTransaction({
        to: "0x1234567890123456789012345678901234567890",
        value: "1000000000000000000",
        data: "0x",
      }),
    ).rejects.toThrow("Provider not found");
  });

  it("should throw an error when calling a contract method without a provider", async () => {
    const walletProviderWithoutProvider = new BaseProvider({} as any);

    await expect(
      walletProviderWithoutProvider.callContractMethod({
        contractAddress: "0x1234567890123456789012345678901234567890",
        abi: [],
        method: "someMethod",
        params: [],
        value: "0",
      }),
    ).rejects.toThrow("Provider not found");
  });
});
