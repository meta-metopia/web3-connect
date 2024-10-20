import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { arrayToHex } from "../../common/address.utils";
import {
  CallContractMethodOptions,
  DeployContractOptions,
  EIP6963AnnounceProviderEvent,
  SendTransactionOptions,
  SupportedChain,
} from "../../sdk";
import { BaseProvider } from "../base.provider";
import { MetaData, SignMessageOptions } from "../provider.interface";
import { OKXWalletIcon } from "./okx.icon";

export class OKXProvider extends BaseProvider {
  metadata: MetaData = {
    name: "OKX",
    image: <OKXWalletIcon />,
    description:
      "Connect using a browser plugin or mobile app. Best supported on Chrome or Firefox.",
    notInstalledText:
      "Dear friend, If you don't have a wallet yet, you can go to install OKX Wallet and create one now.",
    displayName: "OKX Wallet",
    downloadLink: "https://www.okx.com/web3",
    iconBackgroundColor: "black",
    supportedChains: ["ethereum", "solana"],
  };
  rdns = "com.okex.wallet";

  constructor(globalWindow: any) {
    super(globalWindow);
    this.init();
  }

  init() {
    if (this.globalWindow === undefined) {
      return;
    }
    this.globalWindow.addEventListener(
      "eip6963:announceProvider",
      (event: any) => {
        const eipEvent = event as EIP6963AnnounceProviderEvent;
        if (eipEvent.detail.info.rdns === this.rdns) {
          this.provider = eipEvent.detail.provider;
        }
      },
    );
    this.globalWindow.dispatchEvent(new Event("eip6963:requestProvider"));
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
      const solanaWallet = await this.globalWindow.okxwallet.solana;
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
      const provider = this.globalWindow.okxwallet.solana;
      await provider.connect();
      const res = await provider.signMessage(encodedMessage, "utf8");
      return arrayToHex(res.signature);
    }
    return super.signMessage(obj, opts);
  }

  async sendTransaction(options: SendTransactionOptions): Promise<string> {
    if (options.chain === "solana") {
      const provider = this.globalWindow.okxwallet.solana;
      const [fromPubkey] = await this.getWalletAddress("solana");
      const toPubKey = new PublicKey(options.to);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromPubkey),
          toPubkey: toPubKey,
          lamports: BigInt(options.value),
        }),
      );
      const signedTransaction =
        await provider.signAndSendTransaction(transaction);
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(signedTransaction);
    }
    return super.sendTransaction(options);
  }

  async deployContract(options: DeployContractOptions): Promise<string> {
    if (options.chain === "solana") {
    }

    return super.deployContract(options);
  }

  async callContractMethod(
    options: CallContractMethodOptions,
  ): Promise<string> {
    if (options.chain === "solana") {
    }
    return super.callContractMethod(options);
  }
}
