"use client";

import {
  Web3Modal,
  Web3ModalOptions,
  createWeb3Modal,
} from "@web3modal/ethers";
import { ethers } from "ethers";
import {
  callContractMethod,
  deployContract,
} from "../../common/contract.utils";
import { ConnectionResponse, EIP1193Provider } from "../../sdk";
import {
  MetaData,
  SignMessageOptions,
  WalletProvider,
} from "../provider.interface";
import { WalletConnectIcon } from "./WalletConnect.icon";

export class WalletConnectProvider implements WalletProvider {
  private modal?: Web3Modal;
  private hasSignedIn = false;
  private isEnable = false;

  constructor(_: any, options: Web3ModalOptions) {
    try {
      this.modal = createWeb3Modal(options);
      this.getWalletAddress().then((address) => {
        this.hasSignedIn = !!address;
      });
      this.isEnable = true;
    } catch (e) {
      this.isEnable = false;
    }
  }

  async getWalletAddress(): Promise<string | undefined> {
    if (!this.modal?.getWalletProvider()) await this.sleep(1000);
    return this.modal?.getAddress();
  }

  isEnabled(): boolean {
    return this.isEnable;
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getProvider(): EIP1193Provider {
    return this.modal?.getWalletProvider() as any;
  }

  async connect(): Promise<ConnectionResponse> {
    if (this.hasSignedIn) {
      return {
        walletAddress: this.modal?.getAddress()!,
        action: "continue",
      };
    }

    await this.modal?.open();

    return new Promise((resolve, reject) => {
      this.modal?.subscribeState(async (state) => {
        await this.sleep(1000);
        const address = this.modal?.getAddress();
        if (
          state.selectedNetworkId !== undefined ||
          (address !== undefined && state.open === false)
        ) {
          // user has successfully connected
          resolve({
            walletAddress: address!,
            action: this.hasSignedIn ? "skip" : "continue",
          });
        }

        if (
          state.selectedNetworkId === undefined &&
          state.open === false &&
          !this.hasSignedIn
        ) {
          reject(new Error("User closed the modal"));
        }
      });
    });
  }
  onAccountsChanged(callback: (account: string | undefined) => void): void {
    // eslint-disable-next-line
    this.modal?.subscribeWalletInfo(async () => {
      const address = this.modal?.getAddress();
      callback(address);
    });
  }

  async disconnect(): Promise<void> {
    await this.modal?.disconnect();
  }

  // eslint-disable-next-line
  async getBalance(): Promise<string> {
    const provider = this.modal?.getWalletProvider();
    const result = provider?.request({
      method: "eth_getBalance",
      params: [this.modal?.getAddress(), "latest"],
    });
    return result as Promise<string>;
  }
  async switchNetwork(targetChainId: number): Promise<void> {
    await this.modal?.switchNetwork(targetChainId);
  }

  async signMessage(message: any, opts: SignMessageOptions): Promise<string> {
    let strMessage = "";
    const provider = this.modal?.getWalletProvider();
    const address = this.modal?.getAddress();

    if (!provider) {
      throw new Error("Provider not found");
    }

    if (typeof message === "string") {
      strMessage = message;
    } else {
      strMessage = JSON.stringify(message);
    }

    try {
      const messageToBeSigned = `0x${Buffer.from(strMessage, "utf8").toString(
        "hex",
      )}`;
      const signedMessage = await provider.request({
        method: "personal_sign",
        params: [messageToBeSigned, address],
      });

      if (opts.forAuthentication) {
        this.hasSignedIn = true;
      }

      return signedMessage;
    } catch (e: any) {
      if (e.code === 4001 && opts.forAuthentication) {
        await this.modal?.disconnect();
      }
      throw e;
    }
  }

  // eslint-disable-next-line
  async verifyMessage(
    message: string,
    signature: string,
    walletAddress: string,
  ): Promise<boolean> {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress === walletAddress;
  }

  // eslint-disable-next-line
  async chainId(): Promise<number> {
    const chainId = this.modal?.getChainId();
    if (chainId) {
      return chainId;
    }
    throw new Error("Chain id not found");
  }

  onChainChanged(callback: (chainId: number) => void): void {
    this.modal?.subscribeState((state) => {
      callback(state.selectedNetworkId ?? 0);
    });
  }

  init(): void {}

  metadata: MetaData = {
    name: "WalletConnect",
    description:
      "Connect by scanning a QR code with any supported mobile wallet.",
    image: <WalletConnectIcon />,
    displayName: "Wallet Connect",
    notInstalledText:
      "WalletConnect is not available at this moment. Please try again later.",
  };

  isVisible(): boolean {
    return true;
  }

  addNetwork(
    targetChainId: number,
    targetRpc: string,
    targetNetworkName: string,
    targetSymbol: string,
    blockExplorerUrl: string,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async callContractMethod(
    contractAddress: string,
    abi: any,
    method: string,
    params?: any[],
    value?: string,
  ): Promise<string> {
    if (this.getProvider() === undefined) {
      throw new Error("Provider not found");
    }

    const fromAddress = await this.getWalletAddress();
    if (!fromAddress) {
      throw new Error("No wallet address found");
    }

    return callContractMethod({
      provider: this.getProvider(),
      contractAddress,
      abi,
      methodName: method,
      fromAddress,
      params,
      value,
    });
  }

  async deployContract(
    abi: any,
    bytecode: string,
    params?: any[],
    value?: string,
  ): Promise<string> {
    if (this.getProvider() === undefined) {
      throw new Error("Provider not found");
    }

    const fromAddress = await this.getWalletAddress();
    if (!fromAddress) {
      throw new Error("No wallet address found");
    }

    return deployContract({
      provider: this.getProvider(),
      abi,
      bytecode,
      fromAddress,
      params,
      value,
    });
  }

  async sendTransaction(
    to: string,
    value: string,
    data?: string,
  ): Promise<string> {
    const provider = this.modal?.getWalletProvider();
    if (!provider) {
      throw new Error("Provider not found");
    }

    const address = this.modal?.getAddress();
    if (!address) {
      throw new Error("Wallet address not found");
    }

    try {
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to,
            value: ethers.parseEther(value).toString(16), // Convert to hex
            data: data || "0x",
          },
        ],
      });

      return txHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  }
}
