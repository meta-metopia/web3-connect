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

    if (request.method === "personal_sign") {
      return "0xabcdefg";
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

const MetaMaskEvent: EIP6963AnnounceProviderEvent = {
  detail: {
    info: {
      rdns: "io.metamask",
      uuid: "",
      name: "MetaMask",
      icon: "",
    },
    provider: provider,
  },
};

export const DesktopWithMetaMaskEnvironment: Environment = {
  isMobileDevice: false,
  // eslint-disable-next-line
  globalWindow: async () => {
    const EventListener = (name: string, callback: any) => {
      if (name === "eip6963:announceProvider") {
        callback(MetaMaskEvent);
      }
    };

    return {
      dispatchEvent: () => {},
      addEventListener: EventListener,
    };
  },
};

export const DesktopWithOKXEnvironment: Environment = {
  isMobileDevice: false,
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

export const DefaultEnvironment: Environment = {
  isMobileDevice: false,
  // eslint-disable-next-line
  globalWindow: async () => {
    return window;
  },
};
