import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import axios from "axios";
import { arrayToHex } from "../common/address.utils";
import { waitForSolanaTransactionFinished } from "../common/contract/contract.solana.utils";
import { defaultConfig } from "../common/default-config/solana.default.config";
import {
  CallContractMethodOptions,
  DeployContractOptions,
  SendTransactionOptions,
  SolanaProvider,
  SupportedChain,
} from "../sdk";
import { BaseProvider } from "./base.provider";
import {
  CallRequest,
  SignMessageOptions,
  WalletProviderGetBalanceOptions,
} from "./provider.interface";

export class MultiWalletProvider extends BaseProvider {
  protected getSolanaProvider(): SolanaProvider {
    return this.globalWindow.multipleWallet.solana;
  }

  async getBalance(opts: WalletProviderGetBalanceOptions): Promise<string[]> {
    return await Promise.all(
      opts.chains.map(async (chain) => {
        if (chain === "solana") {
          const connection = new Connection(
            opts.walletConfig?.defaultChainConfigs?.solana
              ? opts.walletConfig.defaultChainConfigs.solana.rpcUrl
              : defaultConfig.rpcUrl,
          );
          const [solanaAddress] = await this.getWalletAddress("solana");
          if (solanaAddress) {
            const balance = await connection.getBalance(
              new PublicKey(solanaAddress),
            );
            return balance.toString();
          }
          return "0";
        }
        const [balance] = await this.getEthereumCompatibleChainsBalance(chain);
        return balance;
      }),
    );
  }

  async getWalletAddress(...chains: SupportedChain[]): Promise<string[]> {
    if (this.provider === undefined) {
      throw new Error("Provider not found");
    }
    if (chains.length === 0) return super.getWalletAddress();

    const hasEth = chains.includes("ethereum");
    const hasSol = chains.includes("solana");

    const addresses: string[] = [];
    if (hasEth) {
      const ethAddress = await this.provider.request({
        method: "eth_requestAccounts",
      });
      addresses.push(ethAddress[0]);
    }

    if (hasSol) {
      const solanaWallet = this.getSolanaProvider();
      const address = await solanaWallet.connect();
      if (address) addresses.push(address.publicKey.toString());
    }
    return addresses;
  }

  async signMessage(obj: any, opts: SignMessageOptions): Promise<string> {
    if (opts.chain === "solana") {
      let strMessage = "";
      if (typeof obj === "string") {
        strMessage = obj;
      }

      if (typeof obj === "object") {
        strMessage = JSON.stringify(obj);
      }

      const encodedMessage = new TextEncoder().encode(strMessage);
      const provider = this.getSolanaProvider();
      await provider.connect();
      const res = await provider.signMessage(encodedMessage, "utf8");
      return arrayToHex(res.signature);
    }
    return super.signMessage(obj, opts);
  }

  private getSolanaConnection(): Connection {
    return new Connection(
      this.options.defaultChainConfigs?.solana?.rpcUrl ?? defaultConfig.rpcUrl,
    );
  }

  async sendTransaction(options: SendTransactionOptions): Promise<string> {
    if (options.chain === "solana") {
      const provider = this.getSolanaProvider();
      const connection = this.getSolanaConnection();
      const [fromPubkey] = await this.getWalletAddress("solana");
      const toPubKey = new PublicKey(options.to);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromPubkey),
          toPubkey: toPubKey,
          lamports: BigInt(options.value),
        }),
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(fromPubkey);
      const { signature } = await provider.signAndSendTransaction(transaction);
      await waitForSolanaTransactionFinished(connection, signature);
      return signature;
    }
    return super.sendTransaction(options);
  }

  async deployContract(options: DeployContractOptions): Promise<string> {
    if (options.chain === "solana") {
      throw new Error("Not supported");
    }

    return super.deployContract(options);
  }

  async request(opts: CallRequest): Promise<any> {
    if (opts.chain === "solana") {
      // make a raw request to the provider
      const connection = this.getSolanaConnection();
      const data = await axios.post(connection.rpcEndpoint, {
        jsonrpc: "2.0",
        id: 1,
        method: opts.method,
        params: opts.params,
      });
      if (data.data.error) {
        throw new Error(data.data.error.message);
      }
      return data.data.result;
    }

    return super.request(opts);
  }

  async callContractMethod(
    options: CallContractMethodOptions,
  ): Promise<string> {
    //@ts-expect-error
    if (options.chain === "solana") {
      throw new Error("Solana is not supported.");
    }
    return super.callContractMethod(options);
  }
}
