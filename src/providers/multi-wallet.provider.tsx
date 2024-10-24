import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { arrayToHex } from "../common/address.utils";
import { defaultConfig } from "../common/default-config/solana.default.config";
import {
  CallContractMethodOptions,
  DeployContractOptions,
  SupportedChain,
} from "../sdk";
import { BaseProvider } from "./base.provider";
import {
  SignMessageOptions,
  WalletProviderGetBalanceOptions,
  WalletProviderSendTransactionOptions,
} from "./provider.interface";

function waitForSolanaTransactionFinished(
  connection: Connection,
  signature: string,
) {
  return new Promise((resolve, reject) => {
    const checkSignature = async () => {
      const { value } = await connection.getSignatureStatus(signature);
      const confirmationStatus = value?.confirmationStatus;
      if (confirmationStatus) {
        const hasReachedSufficientCommitment =
          confirmationStatus === "confirmed" ||
          confirmationStatus === "finalized";
        if (hasReachedSufficientCommitment) {
          resolve(void 0);
          return;
        }
      }
      setTimeout(checkSignature, 1000);
    };
    checkSignature();
  });
}

export class MultiWalletProvider extends BaseProvider {
  protected getSolanaProvider(): any {
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
          const balance = await connection.getBalance(
            new PublicKey(solanaAddress),
          );
          return balance.toString();
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
      const solanaWallet = await this.getSolanaProvider();
      const address = await solanaWallet.connect();
      addresses.push(address.publicKey.toString());
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

  async sendTransaction(
    options: WalletProviderSendTransactionOptions,
  ): Promise<string> {
    if (options.chain === "solana") {
      const provider = this.getSolanaProvider();
      const connection = new Connection(
        options.walletConfig.defaultChainConfigs.solana
          ? options.walletConfig.defaultChainConfigs.solana.rpcUrl
          : defaultConfig.rpcUrl,
      );
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

  async callContractMethod(
    options: CallContractMethodOptions,
  ): Promise<string> {
    if (options.chain === "solana") {
      throw new Error("Not supported");
    }
    return super.callContractMethod(options);
  }
}
