import { useContext } from "react";
import useSWR from "swr";
import { SupportedChain } from "../../sdk";
import { WalletContext } from "./WalletContext";

/**
 * Use address hook will return the address of the connected wallet
 *
 * @param chains The list of supported chains
 * @returns The address of the connected wallet
 *
 * @example
 * ```tsx
 * const { addresses, error, isLoading } = useAddress("solana", "ethereum");
 * // addresses = ["0x1234...", "0x5678..."]
 * ```
 */
export function useAddresses(...chains: SupportedChain[]) {
  const { sdk, isSignedIn } = useContext(WalletContext);
  const {
    data: addresses,
    error,
    isLoading,
  } = useSWR(
    {
      chains: chains,
      key: "addresses",
      isSignedIn,
    },
    async (args) => {
      if (!args.isSignedIn) {
        return chains.map(() => "");
      }

      return await sdk.getWalletAddress(...args.chains);
    },
    {
      refreshInterval: 10_000,
    },
  );

  return {
    addresses,
    error,
    isLoading,
  };
}
