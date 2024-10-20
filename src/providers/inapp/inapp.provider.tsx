"use client";

import { WalletIcon } from "./Wallet.icon";

import { BaseProvider } from "../base.provider";
import { MetaData } from "../provider.interface";

/**
 * In app wallet provider will use system injected window.ethereum as provider.
 * If other provider is detected, then this provider will automatically be disabled.
 */
export class InAppWalletProvider extends BaseProvider {
  metadata: MetaData = {
    name: "InApp",
    image: <WalletIcon />,
    description:
      "Connect using the in-app browser of your crypto wallet, Best supported on mobile devices.",
    displayName: "In App Wallet",
    notInstalledText:
      "Dear friend, If you don't have a wallet yet, you can go to app store to get one.",
    downloadLink: "",
    supportedChains: ["ethereum"],
  };
  rdns = "io.inapp";

  constructor(globalWindow: any) {
    super(globalWindow);
    this.init();
  }

  init(): void {
    this.provider = this.globalWindow?.ethereum;
  }

  isVisible(isMobile: boolean): boolean {
    return isMobile && this.isEnabled();
  }

  isEnabled(): boolean {
    return this.provider !== undefined;
  }
}
