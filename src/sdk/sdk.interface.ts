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

export interface SendTransactionOptions {
  /**
   * Recipient address
   */
  to: string;
  /**
   * Value in wei to send with the transaction
   */
  value: string;
  /**
   * Data to send with the transaction
   */
  data?: string;
  /**
   * Optional field to specify `send transaction` on a non-default blockchain.
   * If not specified, "ethereum" is used as the default. Note, not all providers support this field.
   *
   * For EVM and EVM-compatible chains:
   * - Use "ethereum" as the value.
   * - Use `switchToNetwork` to specify other Ethereum-based chains.
   *
   * This field is specifically for non-EVM chains (e.g., Solana).
   *
   * @example
   * // For Solana deployment
   * chain: "solana"
   *
   * // For any Ethereum-based chain (default if omitted)
   * chain: "ethereum"
   * // Then use switchToNetwork to specify the exact chain
   *
   * @default "ethereum"
   */
  chain?: SupportedChain;
}

export interface CallContractMethodOptions {
  /**
   * Contract address
   */
  contractAddress: string;
  /**
   * ABI of the contract
   */
  abi: any;
  /**
   * Method to call
   */
  method: string;
  /**
   * Parameters for the method. Can be empty if the method does not require any parameters.
   */
  params?: any[];
  /**
   * Number of wei to send with the transaction
   */
  value?: string;
  /**
   * Optional field to specify `call contract action` on a non-default blockchain.
   * If not specified, "ethereum" is used as the default.
   *
   * For EVM and EVM-compatible chains:
   * - Use "ethereum" as the value.
   * - Use `switchToNetwork` to specify other Ethereum-based chains.
   *
   * This field is specifically for non-EVM chains (e.g., Solana).
   *
   * @example
   * // For Solana deployment
   * chain: "solana"
   *
   * // For any Ethereum-based chain (default if omitted)
   * chain: "ethereum"
   * // Then use switchToNetwork to specify the exact chain
   *
   * @default "ethereum"
   */
  chain?: SupportedChain;
}

export interface DeployContractOptions {
  /**
   * ABI of the contract
   */
  abi: any;
  /**
   * Bytecode of the contract
   */
  bytecode: string;
  /**
   * Parameters for the constructor. Can be empty if the constructor does not require any parameters.
   */
  params?: any[];
  /**
   * Number of wei to send with the transaction
   */
  value?: string;
  /**
   * Optional field to specify deployment on a non-default blockchain.
   * If not specified, "ethereum" is used as the default.
   *
   * For EVM and EVM-compatible chains:
   * - Use "ethereum" as the value.
   * - Use `switchToNetwork` to specify other Ethereum-based chains.
   *
   * This field is specifically for non-EVM chains (e.g., Solana).
   *
   * @example
   * // For Solana deployment
   * chain: "solana"
   *
   * // For any Ethereum-based chain (default if omitted)
   * chain: "ethereum"
   * // Then use switchToNetwork to specify the exact chain
   *
   * @default "ethereum"
   */
  chain?: SupportedChain;
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
   * @param opts The transaction options
   * @returns A Promise that resolves to the transaction hash
   * @throws Will throw an error if the transaction fails to send
   *
   * @example
   * // Sending 0.1 ETH to an address
   * const txHash = await sendTransaction({
   *  to: "0xRecipient...",
   *  value: "100000000000000000", // 0.1 ETH in wei
   *  });
   *
   */
  sendTransaction(opts: SendTransactionOptions): Promise<string>;

  /**
   * Call a specific method on a smart contract
   * @param opts The contract method options
   * @returns A Promise that resolves to the transaction hash
   * @throws Will throw an error if the contract call fails
   *
   * @example
   * // Calling a 'transfer' method on an ERC20 token contract
   * const txHash = await callContractMethod({
   *     contractAddress: "0xToken...",
   *     abi: [...], // ABI of the ERC20 token contract
   *     method: "transfer",
   *     params: ["0xRecipient...", "1000000000000000000"], // Recipient address and amount in wei
   * });
   */
  callContractMethod(opts: CallContractMethodOptions): Promise<any>;

  /**
   * Deploy a smart contract
   * @param opts The contract deployment options
   * @returns A contract address
   *
   * @example
   * // Deploying a contract with no constructor parameters
   * const contractAddress = await deployContract({
   *     abi: [...], // ABI of the contract
   *     bytecode: "0x...", // Bytecode of the contract
   *     params: [], // No constructor parameters
   *     value: "1000000000000000000", // Value in wei
   *  });
   */
  deployContract(opts: DeployContractOptions): Promise<string>;

  provider: WalletProvider;

  walletProviders: WalletProvider[];
}

export interface OpenWalletOptions {
  hideWhileLoading?: boolean;
}
