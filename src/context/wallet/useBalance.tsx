import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ethers } from "ethers";
import { useContext } from "react";
import useSWR from "swr";
import { isEthereumCompatibleChain } from "../../common/isEthereumCompatibleChain";
import { SupportedChain } from "../../sdk";
import { WalletContext } from "./WalletContext";

export const lamportsToSol = (lamports: number | string) => {
  return Number.parseInt(lamports as any) / LAMPORTS_PER_SOL;
};

/**
 * Get balance for the current wallet
 * @param chains The list of supported chains
 */
export function useBalance(...chains: SupportedChain[]) {
  const { sdk, isSignedIn } = useContext(WalletContext);
  const {
    data: balance,
    error,
    isLoading,
  } = useSWR(
    {
      chains: chains,
      key: "balance",
      isSignedIn,
    },
    async (args) => {
      if (!args.isSignedIn) {
        return chains.map(() => "0");
      }
      const balances = await sdk.getBalance(...args.chains);

      for (const index in balances) {
        const chain = chains[index];

        if (chain === "solana") {
          // format solana balance
          balances[index] = lamportsToSol(balances[index] as any).toString();
        }

        if (isEthereumCompatibleChain(chain)) {
          balances[index] = ethers.formatEther(balances[index]);
        }
      }

      return balances;
    },
    {
      refreshInterval: 10_000,
    },
  );

  return {
    balance,
    error,
    isLoading,
  };
}
