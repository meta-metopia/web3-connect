import { BaseProvider } from "../base.provider";
import { EIP6963AnnounceProviderEvent, MetaData } from "../provider.interface";
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
}
