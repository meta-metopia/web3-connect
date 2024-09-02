import { EIP6963AnnounceProviderEvent } from "../../providers/provider.interface";
import { Environment } from "./environment";

const provider: any = {
  // eslint-disable-next-line
  request: async (request: any) => {
    if (request.method === "eth_requestAccounts") {
      return ["0x6681f8c4cbb47d2acef7afca40c242d5dc56faa9"];
    }

    // balance
    if (request.method === "eth_getBalance") {
      return "0x0";
    }

    //eth_accounts
    if (request.method === "eth_accounts") {
      return ["0x6681f8c4cbb47d2acef7afca40c242d5dc56faa9"];
    }
  },
  on: () => {},
};

const OKXEvent: EIP6963AnnounceProviderEvent = {
  detail: {
    info: {
      rdns: "com.okex.wallet",
      uuid: "",
      name: "OKX",
      icon: "",
    },
    provider: provider,
  },
};

export const MobileBrowserEnvironment: Environment = {
  isMobileDevice: true,
  // eslint-disable-next-line
  globalWindow: async () => {
    return {
      dispatchEvent: () => {},
      addEventListener: () => {},
    };
  },
};

export const MobileMetaMaskEnvironment: Environment = {
  isMobileDevice: true,
  // eslint-disable-next-line
  globalWindow: async () => {
    return {
      ethereum: provider,
      addEventListener: () => {},
      dispatchEvent: () => {},
    };
  },
};

export const MobileOKXEnvironment: Environment = {
  isMobileDevice: true,
  // eslint-disable-next-line
  globalWindow: async () => {
    const EventListener = (name: string, callback: any) => {
      if (name === "eip6963:announceProvider") {
        callback(OKXEvent);
      }
    };

    return {
      dispatchEvent: () => {},
      addEventListener: EventListener,
    };
  },
};

export const MobileDefaultEnvironment: Environment = {
  isMobileDevice: true,
  // eslint-disable-next-line
  globalWindow: async () => {
    return window;
  },
};
