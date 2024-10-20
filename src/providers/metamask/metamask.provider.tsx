import { BaseProvider } from "../base.provider";
import { EIP6963AnnounceProviderEvent, MetaData } from "../provider.interface";
import { MetaMaskIcon } from "./Metamask.icon";

export class MetaMaskProvider extends BaseProvider {
  metadata: MetaData = {
    name: "MetaMask",
    image: <MetaMaskIcon />,
    description:
      "Connect using a browser plugin or mobile app. Best supported on Chrome or Firefox.",
    displayName: "MetaMask",
    notInstalledText:
      "Dear friend, If you don't have a wallet yet, you can go to install MetaMask and create one now.",
    downloadLink: "https://metamask.io/",
    supportedChains: ["ethereum", "solana"],
  };
  rdns = "io.metamask";

  init() {
    if (this.globalWindow === undefined) {
      return;
    }
    // get the provider from the EIP-6963 event
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
