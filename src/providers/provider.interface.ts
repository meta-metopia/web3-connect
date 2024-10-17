import { AvailableProvider } from "../common/availableProviders";
import { ConnectionResponse } from "../sdk/sdk.interface";

export interface SignMessageOptions {
  /**
   * Whether the message is for authentication
   */
  forAuthentication?: boolean;
}

export interface ClaimParams {
  signature: string;
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
}

export interface WalletProvider {
  /**
   * Get the current wallet address, if available
   * @returns wallet address, or undefined if not available
   */
  getWalletAddress(): Promise<string | undefined>;

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
   * @param to The recipient's Ethereum address
   * @param value The amount of Ether to send, as a string (e.g., "0.1" for 0.1 ETH)
   * @param data Optional data to include in the transaction. Use this for contract interactions.
   * @returns A Promise that resolves to the transaction hash
   * @throws Will throw an error if the transaction fails to send
   *
   * @example
   * // Sending 0.1 ETH to an address
   * const txHash = await sendTransaction("0x1234...", "0.1");
   *
   * @example
   * // Interacting with a contract
   * const data = "0x..."; // Encoded contract method call
   * const txHash = await sendTransaction("0xContractAddress...", "0", data);
   */
  sendTransaction(to: string, value: string, data?: string): Promise<string>;

  /**
   * Call a specific method on a smart contract
   * @param contractAddress The Ethereum address of the smart contract
   * @param abi The ABI (Application Binary Interface) of the contract method
   * @param method The name of the method to call on the contract
   * @param params An array of parameters to pass to the contract method
   * @param value The amount of Ether to send with the transaction, as a string in wei
   * @returns A Promise that resolves to the transaction hash
   * @throws Will throw an error if the contract call fails
   *
   * @example
   * // Calling a 'transfer' method on an ERC20 token contract
   * const txHash = await callContractMethod(
   *   "0xContractAddress...",
   *   [{...}], // ABI
   *   "transfer",
   *   ["0xRecipient...", "1000000000000000000"], // 1 token with 18 decimals
   *   "0" // No ETH sent
   * );
   *
   * @example
   * // Calling a 'mint' method on an ERC721 token contract with 1 ETH
   * const txHash = await callContractMethod(
   *  "0xContractAddress...",
   *  [{...}], // ABI
   *  "mint",
   *  ["0xRecipient...", "1"], // Token ID
   *  "1000000000000000000" // 1 ETH
   */
  callContractMethod(
    contractAddress: string,
    abi: any,
    method: string,
    params?: any[],
    value?: string,
  ): Promise<string>;

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
   * @param message Message to verify
   * @param signature Signed message
   * @param walletAddress Wallet address to verify
   */
  verifyMessage(
    message: string,
    signature: string,
    walletAddress: string,
  ): Promise<boolean>;

  metadata: MetaData;
}
