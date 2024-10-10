"use client";

import { ethers } from "ethers";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR, { mutate } from "swr";
import { SessionResponse } from "../../common";
import {
  MetaMaskMockProvider,
  Sdk,
  SwitchToNetworkOptions,
  WalletProvider,
} from "../../sdk";

import { Web3ModalOptions } from "@web3modal/ethers";
import { AvailableProvider } from "../../common";
import { SdkInterface, SignInCallbacks } from "../../sdk";
import { useEnvironment } from "../environment/EnvironmentContext";

interface IWalletContext {
  session: SessionResponse;
  isSignedIn: boolean;
  isLoading: boolean;
  balance: string;
  sdk: SdkInterface;
  chainId?: number;
  walletAddress?: string;
  signIn: (
    provider: AvailableProvider,
    callbacks: SignInCallbacks,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  switchNetwork: (network: SwitchToNetworkOptions) => Promise<void>;
}

const WalletContext = createContext<IWalletContext>({} as any);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface WalletProviderOptions {
  children: any;
  /**
   * Current session
   */
  session: SessionResponse;
  /**
   * Wallet connect configuration.
   * Leave it empty if you don't want to use wallet connect.
   */
  walletConnectConfig?: Web3ModalOptions;
  /**
   * Default providers to be used by the wallet.
   * This field is optional and will override existing providers if needed.
   */
  providers: (new (
    ...args: any[]
  ) => WalletProvider)[];

  onSignedOut: () => Promise<void>;

  /**
   * Should react to account changes?
   * @default true
   */
  listenToAccountChanges?: boolean;

  /**
   * Should react to chain changes?
   * @default true
   */
  listenToChainChanges?: boolean;

  environment?: {
    env: "e2e";
    endpoint: string;
  };
}

function WalletContextProvider({
  children,
  session,
  walletConnectConfig,
  providers,
  environment,
  onSignedOut,
  listenToAccountChanges = true,
  listenToChainChanges = true,
}: WalletProviderOptions) {
  const [isSignedIn, setIsSignedIn] = useState(session.isAuth);
  const [isLoading, setIsLoading] = useState(true);
  const [chainId, setChainId] = useState<number>();
  const [walletAddress] = useState<string | undefined>(session.walletAddress);

  const { isMobileDevice, globalWindow, isTest } = useEnvironment();

  const { data: balance } = useSWR(
    `/balance`,
    async () => {
      if (!isSignedIn) {
        return "0";
      }
      return ethers.formatEther(await sdk.provider.getBalance());
    },
    {
      refreshInterval: 10_000,
    },
  );

  const sdk = useMemo(
    () => new Sdk([], session),
    [globalWindow, isMobileDevice],
  );

  useEffect(() => {
    (async () => {
      if (!globalWindow) return;
      // Wallet connect used web component
      // which is not supported by Next.js (HTMLElement not defined error will be thrown).
      // Even though this error is not breaking the app, it is better to lazy load the wallet connect provider
      // to avoid this error.

      for (const provider of providers ?? []) {
        sdk.registerProvider(new provider(globalWindow, walletConnectConfig));
      }

      // If the environment is e2e, use the mock provider
      if (typeof environment === "object" && environment.env === "e2e") {
        sdk.registerProvider(new MetaMaskMockProvider(environment.endpoint));
      }

      if (!isTest) await sleep(500);
      try {
        const isValid = await sdk.isSessionValid(session);
        // if previous session is not valid, sign out
        // if not signed in before, skip this step
        if (!isValid && !sdk.provider) {
          if (!isTest) await onSignedOut();
          setIsSignedIn(false);
          setIsLoading(false);
          return;
        }
        setIsSignedIn(true);
        const chainId = await sdk.provider.chainId();
        await mutate("/balance");
        setChainId(chainId);
        setIsLoading(false);
        // Listen to account changes
        if (listenToAccountChanges) {
          sdk.onAccountsChanged(async (account) => {
            if (account !== session.walletAddress) {
              await onSignedOut();
              window.location.reload();
              return;
            }
            window.location.reload();
          });
        }

        sdk.onChainChanged(async () => {
          setChainId(await sdk.provider.chainId());
          if (listenToChainChanges) {
            window.location.reload();
          }
        });
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        setIsSignedIn(false);
      }
    })();
  }, [globalWindow, isMobileDevice]);

  const signIn = useCallback(
    async (provider: AvailableProvider, callbacks: SignInCallbacks) => {
      if (!sdk) {
        throw new Error("SDK is not initialized");
      }

      const { action } = await sdk.signIn({
        provider,
        callbacks,
      });
      if (action === "skip") {
        return;
      }
      setIsSignedIn(true);
    },
    [sdk],
  );

  const signOut = useCallback(async () => {
    if (!sdk) {
      throw new Error("SDK is not initialized");
    }
    await sdk.signOut();
    await onSignedOut();
  }, [sdk]);

  const switchNetwork = useCallback(
    async (network: SwitchToNetworkOptions) => {
      if (!sdk) {
        throw new Error("SDK is not initialized");
      }
      await sdk.switchToNetwork(network);
    },
    [sdk],
  );

  const value: IWalletContext = {
    session,
    isLoading,
    isSignedIn,
    balance: balance ?? "0",
    sdk,
    chainId,
    walletAddress,
    signIn,
    signOut,
    switchNetwork,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export { WalletContext, WalletContextProvider };
