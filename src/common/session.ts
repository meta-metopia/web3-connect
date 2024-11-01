import { SupportedChain } from "../sdk";
import { AvailableProvider } from "./availableProviders";

export interface SessionRequest {
  /**
   * Wallet address used for signing in
   */
  walletAddress: string;

  /**
   * Wallet provider
   */
  provider: AvailableProvider;
}

export type WalletAddress = {
  chain: SupportedChain;
  walletAddress: string;
};

export interface SessionResponse extends Partial<SessionRequest> {
  /**
   * Is the user authenticated
   */
  isAuth: boolean;

  /**
   * List of wallet addresses recorded. Unlike the `walletAddress` field only records the wallet address that
   * used in the authentication, this field also records addresses that the wallet supports.
   */
  walletAddresses: WalletAddress[];
}
