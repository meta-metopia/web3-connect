import { AvailableProvider } from "./availableProviders";

export interface SessionRequest {
  /**
   * Wallet address
   */
  walletAddress: string;

  /**
   * Wallet provider
   */
  provider: AvailableProvider;
}

export interface SessionResponse extends Partial<SessionRequest> {
  /**
   * Is the user authenticated
   */
  isAuth: boolean;
}
