"use client";

import { useWallet } from "web3-connect-react";

export default function Home() {
  const { sdk, signIn, signOut } = useWallet();

  return (
    <div className={"flex"}>
      <div className={"mx-auto"}>
        <p>
          Current provider: {sdk?.provider?.metadata.name || "None"}
          {sdk.provider && (
            <button
              onClick={async () => {
                await signOut();
              }}
            >
              Sign out
            </button>
          )}
        </p>
        <p className={"text-2xl font-bold"}>
          Wallet providers available in the SDK:
        </p>
        <ul className={"space-y-5 mt-5"}>
          {sdk?.walletProviders
            .filter((p) => p.isVisible(false))
            .map((p) => (
              <li key={p.metadata.name} className={"flex flex-row"}>
                <div>
                  <label className={"font-bold"}>{p.metadata.name}</label>
                  <p className={"font-light"}>{p.metadata.description}</p>
                </div>
                <button
                  onClick={async () => {
                    await signIn("MetaMask", {
                      onSignedIn: async (walletAddress, provider, session) => {
                        sessionStorage.setItem(
                          "session",
                          JSON.stringify(session),
                        );
                      },
                      getSignInData: async () => {},
                    });
                  }}
                >
                  {p.isEnabled(sdk.walletProviders) ? "Enabled" : "Disabled"}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
