"use client";

import { ReactNode } from "react";
import { WalletContextProvider } from "web3-connect-react";
import {
  MetaMaskProvider,
  OKXProvider,
  PhantomProvider,
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
      providers={[MetaMaskProvider, OKXProvider, PhantomProvider]}
    >
      {children}
    </WalletContextProvider>
  );
}
