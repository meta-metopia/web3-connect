import { ethers } from "ethers";
import { SessionResponse, WalletAddress } from "../common";
import { AvailableProvider } from "../common";
import { WalletProvider } from "../providers";
import { CallRequest } from "../providers/provider.interface";
import {
  CallContractMethodOptions,
  ConnectionResponse,
  DeployContractOptions,
  SdkInterface,
  SendTransactionOptions,
  SignInOptions,
  SupportedChain,
  SwitchToNetworkOptions,
  WalletConfig,
} from "./sdk.interface";

export class Sdk implements SdkInterface {
  private session: SessionResponse | undefined;
  constructor(
    private readonly providers: WalletProvider[],
    private readonly walletConfig: WalletConfig,
    session: SessionResponse | undefined
  ) {
    this.session = session;
  }

  registerProvider(provider: WalletProvider) {
    const foundIndex = this.providers.findIndex(
      (p) => p.metadata.name === provider.metadata.name
    );
    provider.init();
    if (foundIndex !== -1) {
      this.providers[foundIndex] = provider;
      return this;
    }

    this.providers.push(provider);
    return this;
  }

  private getProvider(
    name?: AvailableProvider,
    throwError = true
  ): WalletProvider {
    const provider = this.providers.find((p) => p.metadata.name === name);
    if (!provider && throwError) {
      throw new Error(`Provider ${name} not found`);
    }
    return provider;
  }

  getBalance(...args: SupportedChain[]): Promise<string[]> {
    return this.provider.getBalance({
      chains: args,
      walletConfig: this.walletConfig,
    });
  }

  async getWalletAddress(
    ...chains: SupportedChain[]
  ): Promise<string[] | undefined> {
    return await this.provider?.getWalletAddress(...chains);
  }

  deployContract(opts: DeployContractOptions): Promise<string> {
    return this.provider.deployContract(opts);
  }

  callContractMethod(opts: CallContractMethodOptions): Promise<string> {
    return this.provider.callContractMethod(opts);
  }

  async sendTransaction(opts: SendTransactionOptions): Promise<string> {
    return this.provider.sendTransaction(opts);
  }

  get walletProviders(): WalletProvider[] {
    return this.providers;
  }

  hasInstalledProvider(name: string): boolean {
    const provider = this.providers.find((p) => p.metadata.name === name);
    if (!provider) {
      return false;
    }

    return provider.isEnabled(this.providers);
  }

  get provider() {
    return this.getProvider(this.session?.provider, false);
  }

  async isSessionValid(serverSession: SessionResponse): Promise<boolean> {
    if (!serverSession.isAuth) {
      return false;
    }

    const provider = this.getProvider(serverSession.provider);

    if (!provider) {
      return false;
    }

    if (!serverSession.isAuth) {
      return false;
    }

    const [walletAddress] = await provider.getWalletAddress();
    try {
      return (
        serverSession.isAuth &&
        ethers.getAddress(walletAddress ?? "") ===
          ethers.getAddress(serverSession.walletAddress ?? "")
      );
    } catch (e) {
      return false;
    }
  }

  async signIn(opts: SignInOptions): Promise<ConnectionResponse> {
    const selectedProvider = opts.provider
      ? this.getProvider(opts.provider)
      : this.provider;

    const { action, walletAddress } = await selectedProvider.connect();
    if (action === "skip") {
      return {
        action,
        walletAddress,
      };
    }

    if (opts.network) {
      await selectedProvider.addNetwork(
        opts.network.chainId,
        opts.network.rpcUrl,
        opts.network.networkName,
        opts.network.symbol,
        opts.network.blockExplorerUrl
      );
      await selectedProvider.switchNetwork(opts.network.chainId);
    }

    const data = await opts.callbacks?.getSignInData(
      walletAddress,
      selectedProvider
    );

    const otherAddresses = await selectedProvider.getWalletAddress(
      ...selectedProvider.metadata.supportedChains
    );

    const mappedWalletAddresses: WalletAddress[] = otherAddresses.map(
      (address, index) => ({
        chain: selectedProvider.metadata.supportedChains[index],
        walletAddress: address,
      })
    );

    const session: SessionResponse = {
      walletAddress: walletAddress,
      provider: selectedProvider.metadata.name,
      walletAddresses: mappedWalletAddresses,
      ...data,
    };
    await opts.callbacks?.onSignedIn?.(
      walletAddress,
      selectedProvider,
      session
    );

    this.session = session;

    return {
      action,
      walletAddress,
    };
  }

  async signOut(): Promise<void> {
    if (!this.provider) {
      throw new Error("No provider founded");
    }
    await this.provider.disconnect();
    this.session = undefined;
  }

  onAccountsChanged(callback: (account: string | undefined) => void): void {
    if (!this.provider) {
      return;
    }

    this.provider.onAccountsChanged(callback);
  }

  async addNetwork(network: SwitchToNetworkOptions): Promise<void> {
    if (!this.provider) {
      throw new Error("No provider founded");
    }

    await this.provider.addNetwork(
      network.chainId,
      network.rpcUrl,
      network.networkName,
      network.symbol,
      network.blockExplorerUrl
    );
  }

  async switchToNetwork(opts: SwitchToNetworkOptions): Promise<void> {
    if (!this.provider) {
      throw new Error("No provider founded");
    }
    await this.provider
      .addNetwork(
        opts.chainId,
        opts.rpcUrl,
        opts.networkName,
        opts.symbol,
        opts.blockExplorerUrl
      )
      .catch(() => {
        console.error("Failed to add network");
      });
    await this.provider.switchNetwork(opts.chainId);
  }

  async request(options: CallRequest) {
    return this.provider.request(options);
  }

  onChainChanged(callback: (chainId: number) => void): void {
    if (!this.provider) {
      return;
    }

    this.provider.onChainChanged(callback);
  }
}
