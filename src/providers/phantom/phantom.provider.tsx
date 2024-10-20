import { ConnectionResponse, EIP6963AnnounceProviderEvent } from "../../sdk";
import { MultiWalletProvider } from "../multi-wallet.provider";
import { MetaData } from "../provider.interface";
import PhantomIcon from "./phantom.icon";

export class PhantomProvider extends MultiWalletProvider {
  metadata: MetaData = {
    name: "Phantom",
    image: <PhantomIcon />,
    description:
      "Connect using a browser plugin or mobile app. Best supported on Chrome or Firefox.",
    notInstalledText:
      "Dear friend, If you don't have a wallet yet, you can go to install Phantom Wallet and create one now.",
    displayName: "Phantom Wallet",
    downloadLink: "https://phantom.app/",
    iconBackgroundColor: "black",
    supportedChains: ["ethereum", "solana"],
  };
  rdns = "app.phantom";

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
    return this.globalWindow.phantom.solana;
  }

  async connect(): Promise<ConnectionResponse> {
    return super.connect();
  }
}
