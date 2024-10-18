import { SessionRequest, SessionResponse } from "../common";
import { AvailableProvider } from "../common";
import { WalletProvider } from "../providers";

export type ConnectAction = "skip" | "continue";

export type StatusCallback = (status: "sending" | "signing") => void;

export interface SwitchToNetworkOptions {
  chainId: number;

  rpcUrl: string;

  networkName: string;

  symbol: string;

  blockExplorerUrl?: string;
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

/**
 * The supported chains
 * - `ethereum`: Ethereum or EVM compatible chains
 * - `solana`: Solana
 */
export type SupportedChain = "ethereum" | "solana";

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

  /**
   * Get the wallet address by the list of supported chains
   * @param args The list of supported chains
   *
   * @example
   * // Get the wallet address for Ethereum
   * const ethAddress = await getWalletAddress("ethereum"); // "0x1234..."
   *
   * @example
   * // Get the wallet address for multiple chains
   * const [ethAddress, solAddress] = await getWalletAddress("ethereum", "solana");
   *
   */
  getWalletAddress(...args: SupportedChain[]): Promise<string[]>;

  /**
   * get balance of the wallet address for the supported chains
   * @param args The list of supported chains
   * @returns A Promise that resolves to the balance of the wallet address
   * @throws Will throw an error if the balance cannot be retrieved
   * @example
   * // Get the balance for Ethereum
   * const ethBalance = await getBalance("evm"); // "1000000000000000000"
   *
   * @example
   * // Get the balance for multiple chains
   * const [ethBalance, solBalance] = await getBalance("evm", "solana");
   */
  getBalance(...args: SupportedChain[]): Promise<string>;

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
   * Deploy a smart contract
   * @param abi The ABI (Application Binary Interface) of the contract
   * @param bytecode The compiled bytecode of the contract
   * @param params An array of parameters to pass to the contract constructor, if any
   * @param value The amount of Ether to send with the transaction, as a string in wei, if any
   *
   * @returns A contract address
   *
   * @example
   * // Deploying a contract with no constructor parameters
   * const contractAddress = await deployContract(
   *  [{...}], // ABI
   *  "0x...", // Bytecode
   *  [] // No constructor parameters
   *  );
   */
  deployContract(
    abi: any,
    bytecode: string,
    params?: any[],
    value?: string,
  ): Promise<string>;

  provider: WalletProvider;

  walletProviders: WalletProvider[];
}

export interface OpenWalletOptions {
  hideWhileLoading?: boolean;
}
