import { SessionRequest, SessionResponse } from "../common";
import { AvailableProvider } from "../common/availableProviders";
import { WalletProvider } from "../providers";

export type ConnectAction = "skip" | "continue";

export type StatusCallback = (status: "sending" | "signing") => void;

export interface SwitchToNetworkOptions {
  chainId: number;

  rpcUrl: string;

  networkName: string;

  symbol: string;
}

export interface ConnectionResponse {
  /**
   * The action to take after connecting.
   *
   * - `skip`: User already connected, skip the connection
   * - `continue`: Continue with the connection
   */
  action: ConnectAction;
  walletAddress: string;
}

export interface SignInCallbacks {
  getSignInData: (address: string, provider: WalletProvider) => Promise<any>;
  onSignedIn?: (
    address: string,
    provider: WalletProvider,
    session: SessionRequest,
  ) => Promise<any>;
}
export interface SignInOptions {
  provider?: AvailableProvider;
  network?: SwitchToNetworkOptions;
  callbacks?: SignInCallbacks;
}

export interface SdkInterface {
  /**
   * Check if the server session is valid using the following methods:
   * 1. Check if serverSession.isAuth is true
   * 2. Check if the current signed in wallet address is the same as serverSession.walletAddress
   */
  isSessionValid(serverSession: SessionResponse): Promise<boolean>;

  /**
   * Sign in to the server
   */
  signIn(opts: SignInOptions): Promise<ConnectionResponse>;

  /**
   * Sign out from the server
   */
  signOut(): Promise<void>;

  /**
   * Event listener for account changes
   */
  onAccountsChanged(callback: (account: string | undefined) => void): void;

  /**
   * Switch to the target network
   * @param opts The target network options
   */
  switchToNetwork(opts: SwitchToNetworkOptions): Promise<void>;

  onChainChanged(callback: (chainId: number) => void): void;

  provider: WalletProvider;

  walletProviders: WalletProvider[];
}

export interface OpenWalletOptions {
  hideWhileLoading?: boolean;
}
