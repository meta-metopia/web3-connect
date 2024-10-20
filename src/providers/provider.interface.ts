import React from "react";
import { AvailableProvider } from "../common";
import {
  CallContractMethodOptions,
  ConnectionResponse,
  DeployContractOptions,
  SendTransactionOptions,
  SupportedChain,
} from "../sdk";

export interface SignMessageOptions {
  /**
   * Whether the message is for authentication
   */
  forAuthentication?: boolean;

  chain?: SupportedChain;
}

export interface VerifyMessageOptions {
  chain?: SupportedChain;
  message: string;
  signature: string;
  walletAddress: string;
}

export interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

export interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void,
  ) => void;
  send?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void,
  ) => void;
  request: (request: { method: string; params?: Array<any> }) => Promise<any>;
  on: (event: string, callback: (event: any) => void) => void;
}

export type EIP6963AnnounceProviderEvent = {
  detail: {
    info: EIP6963ProviderInfo;
    provider: Readonly<EIP1193Provider>;
  };
};

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface MetaData {
  name: AvailableProvider;
  displayName: string;
  description: string;
  image: React.ReactNode;
  downloadLink?: string;
  notInstalledText: string;
  iconBackgroundColor?: string;
  supportedChains: SupportedChain[];
}

export interface WalletProvider {
  /**
   * Get the current wallet address, if available
   * @returns wallet address, or undefined if not available
   */
  getWalletAddress(...chains: SupportedChain[]): Promise<string[]>;

  /**
   * Check wheter the given provider is enabled. Otherwise, no installed text will be shown
   */
  isEnabled(providers: WalletProvider[]): boolean;

  /**
   * Determine whether the provider is visible on the current device
   */
  isVisible(isMobile: boolean): boolean;

  /**
   * Connect to the wallet provider
   * @returns wallet address
   */
  connect(): Promise<ConnectionResponse>;

  /**
   * Send a transaction on the blockchain
   * @param opts The transaction options
   *
   * @example
   * // Interacting with a contract
   * const data = "0x..."; // Encoded contract method call
   * const txHash = await sendTransaction(opts);
   */
  sendTransaction(opts: SendTransactionOptions): Promise<string>;

  /**
   * Call a specific method on a smart contract
   * @param opts The contract method options
   */
  callContractMethod(opts: CallContractMethodOptions): Promise<string>;

  deployContract(opts: DeployContractOptions): Promise<string>;

  /**
   * Listen to account changes. If account is undefined, the user has signed out
   */
  onAccountsChanged(callback: (account: string | undefined) => void): void;

  /**
   * Listen to chain changes
   */
  onChainChanged(callback: (chainId: number) => void): void;

  /**
   * Disconnect the wallet provider
   */
  disconnect(): Promise<void>;

  /**
   * Get current wallet balance
   */
  getBalance(): Promise<string>;

  /**
   * Switch to a different network
   * @param targetChainId The chain id of the target network
   */
  switchNetwork(targetChainId: number): Promise<void>;

  /**
   * Add a network to the wallet provider
   * @param targetChainId
   * @param targetRpc
   * @param targetNetworkName
   * @param targetSymbol
   * @param blockExplorerUrl
   */
  addNetwork(
    targetChainId: number,
    targetRpc: string,
    targetNetworkName: string,
    targetSymbol: string,
    blockExplorerUrl: string,
  ): Promise<void>;

  /**
   * Sign a message
   * @param message The message to sign. Can be a string or an object
   *
   * @param opts
   */
  signMessage(message: any, opts: SignMessageOptions): Promise<string>;

  /**
   * Get web3 provider
   */
  getProvider(): any;

  /**
   * Get the current chain id
   */
  chainId(): Promise<number>;

  /**
   * Initialize the provider
   */
  init(): void;

  /**
   *
   * @param opts The message to verify
   */
  verifyMessage(opts: VerifyMessageOptions): Promise<boolean>;

  metadata: MetaData;
}
