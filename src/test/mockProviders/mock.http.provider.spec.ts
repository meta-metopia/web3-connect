import { MockHttpProvider, Network } from "./mock.http.provider";
import { ethers } from "ethers";

describe("MockHttpProvider", () => {
  let mockHttpProvider: MockHttpProvider;

  beforeEach(() => {
    const networkList: Network[] = [
      {
        chainId: 1,
        chainName: "Ethereum Mainnet",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://mainnet.infura.io/v3/YOUR-PROJECT-ID"],
        blockExplorerUrls: ["https://etherscan.io"],
      },
    ];
    const wallet = ethers.Wallet.createRandom();
    mockHttpProvider = new MockHttpProvider({
      privateKey: wallet.privateKey,
      networkList: networkList,
    });
  });

  it("should update balance correctly", async () => {
    // 10 ETH
    const newBalance = "10";
    mockHttpProvider.updateBalance(newBalance);
    const balance = await mockHttpProvider.request("eth_getBalance", []);
    expect(balance).toBe("0x" + ethers.parseEther(newBalance).toString(16));
  });

  // eslint-disable-next-line
  it("should be able to add network", async () => {
    const network: Network = {
      chainId: 3,
      chainName: "Ropsten",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://ropsten.infura.io/v3/YOUR-PROJECT-ID"],
      blockExplorerUrls: ["https://ropsten.etherscan.io"],
    };
    mockHttpProvider.addNetwork(network);
    expect(mockHttpProvider.networkList).toContain(network);
  });

  it("should not be able to switch to not added network", async () => {
    const chainId = 3;
    await expect(
      mockHttpProvider.request("wallet_switchEthereumChain", [
        { chainId: chainId },
      ]),
    ).rejects.toThrow();
  });

  it("should be able to switch network", async () => {
    const chainId = 3;
    const network: Network = {
      chainId: chainId,
      chainName: "Ropsten",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://ropsten.infura.io/v3/YOUR-PROJECT-ID"],
      blockExplorerUrls: ["https://ropsten.etherscan.io"],
    };
    mockHttpProvider.addNetwork(network);
    await mockHttpProvider.request("wallet_switchEthereumChain", [
      { chainId: chainId },
    ]);
    const currentChainId = await mockHttpProvider.request("eth_chainId", []);
    expect(currentChainId).toBe("0x3");
  });
});
