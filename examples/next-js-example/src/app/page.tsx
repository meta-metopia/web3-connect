"use client";
import { ContractInteract } from "@/components/contract-interact";
import { WalletConnect } from "@/components/wallet-connect";
import { useWallet } from "web3-connect-react";

export default function Home() {
  const { isSignedIn } = useWallet();

  return (
    <div>
      <WalletConnect />
      {isSignedIn && <ContractInteract />}
    </div>
  );
}
