import { ethers } from "ethers";
import Fastify, { FastifyInstance } from "fastify";
import { MockHttpProvider } from "../../test";
import { MetaMaskMockProvider } from "./metamask.mock.provider";

describe("MetamaskMockProvider", () => {
  let provider: MetaMaskMockProvider;
  let wallet: ethers.HDNodeWallet;
  let app: FastifyInstance;
  let mockHttpProvider: MockHttpProvider;

  beforeAll(async () => {
    app = Fastify();
    app.post("/", async (request, reply) => {
      const body = request.body as any;

      try {
        const result = await mockHttpProvider.request(body.method, body.params);
        return {
          data: result,
        };
      } catch (e: any) {
        reply.code(400).send({
          error: e.message,
        });
      }
    });

    await app.listen({
      port: 3001,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    wallet = ethers.Wallet.createRandom();
    provider = new MetaMaskMockProvider("http://localhost:3001");
    mockHttpProvider = new MockHttpProvider({
      privateKey: wallet.privateKey,
      networkList: [
        {
          chainId: 1,
          chainName: "Mainnet",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 0,
          },
          rpcUrls: [],
          blockExplorerUrls: [],
        },
      ],
    });
  });

  it("Should be able to get balance", async () => {
    const balance = await provider.getBalance();
    expect(balance).toEqual("0x0");
  });

  it("should be able to get address", async () => {
    const address = await provider.getWalletAddress();
    expect(address).toEqual(wallet.address);
  });

  it("should be able to check if MetaMask is enabled", () => {
    expect(provider.isEnabled()).toBeTruthy();
  });

  it("should be able to disconnect", async () => {
    await provider.disconnect();
  });

  it("should be able to sign a message", async () => {
    const message = "Hello World";
    const signature = await provider.signMessage(message, {
      forAuthentication: false,
    });
    expect(signature).toBeDefined();
  });

  it("should be able to switch network", async () => {
    await provider.addNetwork(3, "http://localhost:8545", "Ropsten", "ETH", "");
    await provider.switchNetwork(3);
    const chainId = await provider.chainId();
    expect(chainId).toEqual(3);
  });

  it("should be able to get chainId", async () => {
    const chainId = await provider.chainId();
    expect(chainId).toEqual(1);
  });

  it("should be visible", () => {
    const isVisible = provider.isVisible(false);
    expect(isVisible).toBeTruthy();
  });
});
