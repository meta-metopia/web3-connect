"use client";

import { ReactNode } from "react";
import { WalletContextProvider } from "web3-connect-react";
import {
  MetaMaskProvider,
  OKXProvider,
  PhantomProvider,
  WalletConnectProvider,
} from "web3-connect-react/providers";

export function Providers({ children }: { children: ReactNode }) {
  const session = sessionStorage.getItem("session");
  const parsedSession = session ? JSON.parse(session) : { isAuth: false };

  return (
    <WalletContextProvider
      onSignedOut={async () => {
        sessionStorage.removeItem("session");
      }}
      session={parsedSession}
      providers={[
        MetaMaskProvider,
        OKXProvider,
        PhantomProvider,
        WalletConnectProvider({
          projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
          chains: [
            {
              chainId: 1,
              name: "Ethereum",
              currency: "ETH",
              rpcUrl:
                "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
              explorerUrl: "https://etherscan.io",
            },
          ],
          ethersConfig: {
            metadata: {
              name: "",
              description: "",
              url: "",
              icons: [],
            },
          },
        }),
      ]}
      listenToChainChanges={false}
      listenToAccountChanges={false}
      walletConfig={{
        defaultChainConfigs: {
          solana: {
            rpcUrl: "https://api.devnet.solana.com",
          },
        },
      }}
    >
      {children}
    </WalletContextProvider>
  );
}
