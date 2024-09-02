"use client";

import { ReactNode } from "react";
import { EnvironmentProvider, WalletContextProvider } from "web3-connect-react";
import { MetaMaskProvider, OKXProvider } from "web3-connect-react/providers";

export function Providers({ children }: { children: ReactNode }) {
  const session = sessionStorage.getItem("session");
  const parsedSession = session ? JSON.parse(session) : { isAuth: false };

  return (
    <EnvironmentProvider isMobile={false}>
      <WalletContextProvider
        onSignedOut={async () => {
          sessionStorage.removeItem("session");
        }}
        session={parsedSession}
        providers={[MetaMaskProvider, OKXProvider]}
      >
        {children}
      </WalletContextProvider>
    </EnvironmentProvider>
  );
}
