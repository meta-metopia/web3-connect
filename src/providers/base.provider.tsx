import { ethers } from "ethers";
import nacl from "tweetnacl";
import {
  convertSolanaAddressStringToUint8Array,
  hexToArray,
} from "../common/address.utils";
import { callContractMethod, deployContract } from "../common/contract.utils";
import { rpcMap } from "../common/default-config/rpcMap";
import { isEthereumCompatibleChain } from "../common/isEthereumCompatibleChain";
import {
  CallContractMethodOptions,
  ConnectionResponse,
  DeployContractOptions,
  SendTransactionOptions,
  SupportedChain,
} from "../sdk";
import {
  EIP1193Provider,
  MetaData,
  SignMessageOptions,
  VerifyMessageOptions,
  WalletProvider,
  WalletProviderGetBalanceOptions,
} from "./provider.interface";

function waitForEtherTransactionFinished(
  provider: EIP1193Provider,
  txHash: string,
) {
  return new Promise((resolve, reject) => {
    const checkTransaction = async () => {
      const txReceipt = await provider.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
      // check if the transaction has been mined
      if (txReceipt) {
        resolve(void 0);
        return;
      }
      setTimeout(checkTransaction, 1000);
    };
    checkTransaction().catch((e) => {
      console.error("Error checking transaction", e);
      reject(e);
    });
  });
}

export class BaseProvider implements WalletProvider {
  metadata: MetaData = {
    name: "BaseProvider",
    image: <div>Base</div>,
    description: "Base provider",
    displayName: "Base provider",
    notInstalledText: "No provider found.",
    downloadLink: "",
    supportedChains: ["ethereum"],
  };
  rdns = "test.base";
  provider: EIP1193Provider | undefined;

  constructor(protected readonly globalWindow: any) {}

  init() {}

  getProvider() {
    return this.provider;
  }

  async connect(): Promise<ConnectionResponse> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    // request access to the user's MetaMask account
    const accounts = await this.provider.request({
      method: "eth_requestAccounts",
    });

    return {
      walletAddress: ethers.getAddress(accounts[0]),
      action: "continue",
    };
  }

  private toHex(value: number): string {
    return `0x${value.toString(16)}`;
  }

  async signMessage(obj: any, opts: SignMessageOptions): Promise<string> {
    let strMessage = "";

    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    if (opts.chain && opts.chain !== "ethereum") {
      throw new Error(`${opts.chain} is not supported by this provider`);
    }

    if (typeof obj === "string") {
      strMessage = obj;
    }

    if (typeof obj === "object") {
      strMessage = JSON.stringify(obj);
    }

    // sign the message
    const [fromAddress] = await this.getWalletAddress();
    const messageToBeSigned = `0x${Buffer.from(strMessage, "utf8").toString("hex")}`;
    return await this.provider.request({
      method: "personal_sign",
      params: [messageToBeSigned, fromAddress],
    });
  }

  /**
   * Verify the signed message
   */
  // eslint-disable-next-line
  async verifyMessage(opts: VerifyMessageOptions): Promise<boolean> {
    if (opts.chain === "solana") {
      const backToUint8Array = hexToArray(opts.signature);
      return nacl.sign.detached.verify(
        new TextEncoder().encode(opts.message),
        backToUint8Array,
        convertSolanaAddressStringToUint8Array(opts.walletAddress),
      );
    }

    const bytesMessage = `0x${Buffer.from(opts.message, "utf8").toString("hex")}`;
    const recoveredAddress = ethers.verifyMessage(bytesMessage, opts.signature);
    return recoveredAddress === opts.walletAddress;
  }

  async addNetwork(
    targetChainId: number,
    targetRpc: string,
    targetNetworkName: string,
    targetSymbol: string,
    blockExplorerUrl: string,
  ): Promise<void> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    await this.provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: this.toHex(targetChainId),
          chainName: targetNetworkName,
          nativeCurrency: {
            name: targetSymbol,
            symbol: targetSymbol,
            decimals: 18,
          },
          rpcUrls: [targetRpc],
          blockExplorerUrls: [blockExplorerUrl],
        },
      ],
    });
  }

  /**
   * Switch to the target network
   */
  async switchNetwork(targetChainId: number): Promise<void> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }
    // get current chainId
    const chainId = await this.provider.request({ method: "eth_chainId" });
    // check if the current chainId is the same as the target chainId
    if (chainId === this.toHex(targetChainId)) {
      return;
    }

    // switch to the target network
    await this.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: this.toHex(targetChainId) }],
    });
  }

  async getWalletAddress(...chains: SupportedChain[]): Promise<string[]> {
    if (this.provider === undefined) {
      return undefined;
    }

    if (chains.length === 0 || chains[0] === "ethereum") {
      // check if wallet is connected
      const accounts = await this.provider.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        return undefined;
      }
      return [ethers.getAddress(accounts[0])];
    }
    throw new Error("Chain not supported");
  }

  /**
   * Check if MetaMask is enabled(available in the browser)
   */
  isEnabled(): boolean {
    if (this.provider === undefined) {
      return false;
    }

    // check if the provider has the request method
    if ("request" in this.provider) {
      return true;
    }
    return false;
  }

  onAccountsChanged(callback: (account: string | undefined) => void): void {
    if (this.provider === undefined) {
      return;
    }

    this.provider.on("accountsChanged", (accounts: string[]) => {
      callback(accounts[0]);
    });
  }

  async sendTransaction({
    to,
    data,
    value,
    chain,
  }: SendTransactionOptions): Promise<string> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    if (chain && chain !== "ethereum") {
      throw new Error(`${chain} is not supported by this provider`);
    }

    const [fromAddress] = await this.getWalletAddress();
    if (!fromAddress) {
      throw new Error("No wallet address found");
    }

    const transactionParameters: ethers.TransactionLike = {
      to,
      from: fromAddress,
      value: value,
      data: data || "0x",
    };

    try {
      const txHash = await this.provider.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });
      await waitForEtherTransactionFinished(this.provider, txHash);
      return txHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw new Error("Failed to send transaction");
    }
  }

  async deployContract({
    abi,
    bytecode,
    params = [],
    value = "0",
    chain,
  }: DeployContractOptions): Promise<string> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    if (chain && chain !== "ethereum") {
      throw new Error(`${chain} is not supported by this provider`);
    }

    const [fromAddress] = await this.getWalletAddress();
    if (!fromAddress) {
      throw new Error("No wallet address found");
    }
    return deployContract({
      provider: this.provider,
      abi,
      bytecode,
      fromAddress,
      params,
      value,
    });
  }

  async callContractMethod({
    contractAddress,
    abi,
    method,
    params = [],
    value = "0",
    chain,
  }: CallContractMethodOptions): Promise<string> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    if (chain && chain !== "ethereum") {
      throw new Error(`${chain} is not supported by this provider`);
    }

    const [fromAddress] = await this.getWalletAddress();
    if (!fromAddress) {
      throw new Error("No wallet address found");
    }

    return callContractMethod({
      provider: this.provider,
      contractAddress,
      abi,
      methodName: method,
      fromAddress,
      params,
      value,
    });
  }

  async disconnect(): Promise<void> {
    if ("disconnect" in this.provider) {
      await (this.provider as any).disconnect();
    }
  }

  protected async getEthereumCompatibleChainsBalance(
    ...chains: SupportedChain[]
  ): Promise<string[]> {
    const foundNotCompatibleChain = chains.find(
      (chain) => !isEthereumCompatibleChain(chain),
    );
    if (foundNotCompatibleChain) {
      throw new Error(`${foundNotCompatibleChain} is not supported`);
    }

    const [ethereum] = await this.getWalletAddress("ethereum");
    return await Promise.all(
      chains.map(async (chain) => {
        if (chain === "ethereum") {
          return await this.provider.request({
            method: "eth_getBalance",
            params: [ethereum, "latest"],
          });
        }
        const rpc = rpcMap[chain];
        const provider = new ethers.JsonRpcProvider(rpc);
        return await provider.getBalance(ethereum);
      }),
    );
  }

  async getBalance(opts: WalletProviderGetBalanceOptions): Promise<string[]> {
    if (this.provider === undefined) {
      return ["0"];
    }

    if (opts.chains.length === 0) {
      return this.getEthereumCompatibleChainsBalance("ethereum");
    }

    const accounts = await this.provider.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return ["0"];
    }

    return this.getEthereumCompatibleChainsBalance(...opts.chains);
  }

  async chainId(): Promise<number> {
    if (this.provider === undefined) {
      throw new Error("MetaMask not found");
    }

    const chainId = await this.provider.request({ method: "eth_chainId" });
    return Number.parseInt(chainId, 16);
  }

  onChainChanged(callback: (chainId: number) => void): void {
    if (this.provider === undefined) {
      return;
    }

    this.provider.on("chainChanged", (chainId: string) => {
      callback(Number.parseInt(chainId, 16));
    });
  }

  isVisible(isMobile: boolean): boolean {
    return isMobile ? this.isEnabled() : true;
  }
}
