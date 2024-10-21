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
import { AvailableProvider, useWallet } from "web3-connect-react";

export function WalletConnect() {
  const { sdk, signIn, signOut, isSignedIn } = useWallet();
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

  return (
    <div className="container mx-auto">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>
            Connect your wallet to interact with the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Current Provider</h3>
            <div className="flex items-center justify-between bg-secondary p-3 rounded-md">
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
              .map((p) => (
                <Card key={p.metadata.name}>
                  <CardContent className="flex items-center justify-between p-4 flex-wrap">
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
                        p.isEnabled(sdk.walletProviders)
                          ? "default"
                          : "secondary"
                      }
                      onClick={() => handleSignIn(p.metadata.name)}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      {p.isEnabled(sdk.walletProviders)
                        ? "Connect"
                        : "Disabled"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
