import { EIP6963AnnounceProviderEvent } from "../../sdk";
import { MultiWalletProvider } from "../multi-wallet.provider";
import { MetaData } from "../provider.interface";
import { OKXWalletIcon } from "./okx.icon";

export class OKXProvider extends MultiWalletProvider {
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

  protected getSolanaProvider() {
    return this.globalWindow.okxwallet.solana;
  }
}
