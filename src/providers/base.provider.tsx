import { ethers } from "ethers";
import { callContractMethod, deployContract } from "../common/contract.utils";
import { ConnectionResponse } from "../sdk";
import {
  EIP1193Provider,
  MetaData,
  WalletProvider,
} from "./provider.interface";

export class BaseProvider implements WalletProvider {
  metadata: MetaData = {
    name: "BaseProvider",
    image: <div>Base</div>,
    description: "Base provider",
    displayName: "Base provider",
    notInstalledText: "No provider found.",
    downloadLink: "",
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

  async signMessage(
    obj: any,
    p0: { forAuthentication: boolean },
  ): Promise<string> {
    let strMessage = "";

    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    if (typeof obj === "string") {
      strMessage = obj;
    }

    if (typeof obj === "object") {
      strMessage = JSON.stringify(obj);
    }

    // sign the message
    const messageToBeSigned = `0x${Buffer.from(strMessage, "utf8").toString("hex")}`;
    const signature = await this.provider.request({
      method: "personal_sign",
      params: [messageToBeSigned, await this.getWalletAddress()],
    });
    return signature;
  }

  /**
   * Verify the signed message
   */
  // eslint-disable-next-line
  async verifyMessage(
    message: string,
    signature: string,
    walletAddress: string,
  ): Promise<boolean> {
    const bytesMessage = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    const recoveredAddress = ethers.verifyMessage(bytesMessage, signature);
    return recoveredAddress === walletAddress;
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

  async getWalletAddress(): Promise<string | undefined> {
    if (this.provider === undefined) {
      return undefined;
    }

    // check if wallet is connected
    const accounts = await this.provider.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return undefined;
    }
    return ethers.getAddress(accounts[0]);
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

  async sendTransaction(
    to: string,
    value: string,
    data?: string,
  ): Promise<string> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    const from = await this.getWalletAddress();
    if (!from) {
      throw new Error("No wallet address found");
    }

    const transactionParameters = {
      to,
      from,
      value: "0x" + ethers.parseEther(value).toString(16),
      data: data || "0x",
    };

    try {
      const txHash = await this.provider.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      return txHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw new Error("Failed to send transaction");
    }
  }

  async deployContract(
    abi: any[],
    bytecode: string,
    params: any[] = [],
    value = "0",
  ): Promise<string> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    const fromAddress = await this.getWalletAddress();
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

  async callContractMethod(
    contractAddress: string,
    abi: any[],
    methodName: string,
    params: any[],
    value = "0",
  ): Promise<string> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }

    const fromAddress = await this.getWalletAddress();
    if (!fromAddress) {
      throw new Error("No wallet address found");
    }

    return callContractMethod({
      provider: this.provider,
      contractAddress,
      abi,
      methodName,
      fromAddress,
      params,
      value,
    });
  }

  async disconnect(): Promise<void> {}

  async getBalance(): Promise<string> {
    if (this.provider === undefined) {
      return "0";
    }

    const accounts = await this.provider.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return "0";
    }

    const balance = await this.provider.request({
      method: "eth_getBalance",
      params: [accounts[0], "latest"],
    });

    return balance;
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
