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
   * @param targetRpc The rpc url of the target network
   * @param shouldAdd Whether to add the network if it doesn't exist
   */
  switchNetwork(
    targetChainId: number,
    targetRpc: string,
    shouldAdd: boolean,
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
