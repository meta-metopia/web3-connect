"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AvailableProvider, useBalance, useWallet } from "web3-connect-react";

export function WalletConnect() {
  const { sdk, signIn, signOut, isSignedIn } = useWallet();
  const { balance, isLoading, error } = useBalance("ethereum", "solana");
  const router = useRouter();
  const [addresses, setAddresses] = useState<
    {
      address: string;
      chain: string;
    }[]
  >([]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = async (providerName: AvailableProvider) => {
    await signIn(providerName, {
      onSignedIn: async (walletAddress, provider, session) => {
        sessionStorage.setItem("session", JSON.stringify(session));
        router.refresh();
      },
      getSignInData: async () => {},
    });
  };

  useEffect(() => {
    if (!isSignedIn) {
      setAddresses([]);
    }
    if (!sdk) return;
    if (!sdk.provider) return;
    sdk
      .getWalletAddress("ethereum", "solana")
      .then((addresses) => {
        setAddresses([
          {
            address: addresses[0],
            chain: "ethereum",
          },
          {
            address: addresses[1],
            chain: "solana",
          },
        ]);
      })
      .catch(console.error);
  }, [sdk, isSignedIn]);

  const getChainName = (index: number) => {
    if (index === 0) {
      return "ethereum";
    }

    return "solana";
  };

  console.log("balance", balance);

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>
            Connect your wallet to interact with the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Current Provider</h3>
            <div className="flex items-center justify-between bg-secondary p-3 rounded-md flex-wrap">
              <span>{sdk?.provider?.metadata.name || "None"}</span>
              {sdk.provider && (
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              )}
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">
            Available Wallet Providers
          </h3>
          <div className="space-y-4">
            {sdk?.walletProviders
              .filter((p) => p.isVisible(false))
              .map((p) => {
                const isConnected =
                  sdk.provider?.metadata.name === p.metadata.name;
                return (
                  <Card key={p.metadata.name}>
                    <CardContent className="flex items-center justify-between p-4 flex-wrap space-y-4">
                      <div>
                        <div className="font-semibold flex flex-row items-center space-x-2">
                          <span> {p.metadata.name}</span>
                          {React.cloneElement(p.metadata.image as any, {
                            className: `!w-8 !h-8 bg-[${p.metadata.iconBackgroundColor}] rounded-lg p-1`,
                          })}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {p.metadata.description}
                        </p>
                      </div>
                      <Button
                        variant={
                          isConnected
                            ? "ghost"
                            : p.isEnabled(sdk.walletProviders)
                              ? "default"
                              : "secondary"
                        }
                        onClick={async () => {
                          if (p.isEnabled(sdk.walletProviders)) {
                            await handleSignIn(p.metadata.name);
                          } else {
                            window.open(p.metadata.downloadLink, "_blank");
                          }
                        }}
                        disabled={sdk.provider !== undefined}
                      >
                        {!isConnected && <Wallet className="w-4 h-4 mr-2" />}
                        {isConnected
                          ? "Connected"
                          : p.isEnabled(sdk.walletProviders)
                            ? "Connect"
                            : "Not Installed"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
          <div className={"mt-6"}>
            <h3 className="text-lg font-semibold mb-4">Wallet addresses</h3>
            <ol>
              {addresses.map((address, index) => (
                <li
                  key={address.address ?? `unknown-${index}`}
                  className={"break-all"}
                >
                  <b>{address.chain}</b> {address.address}
                </li>
              ))}
            </ol>
            <h3 className="text-lg font-semibold mb-4">Wallet Balance</h3>
            <ol>
              {error && <li>{error.message}</li>}
              {balance?.map((balance, index) => (
                <li
                  key={`unknown-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    index
                  }`}
                >
                  {getChainName(index)}: {balance}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
