import { getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import useSWR from "swr";
import { useAddresses } from "./useAddress";
import { useWallet } from "./useWallet";

/**
 * Get the SPL wallet balance on the Solana blockchain.
 * Will return 0 if the wallet account on the blockchain is not found.
 *
 * @param mintAddress The mint address of the SPL token.
 * @returns The balance of the wallet account.
 */
export function useSplWalletBalance(mintAddress: string) {
  const { addresses } = useAddresses("solana");
  const { sdk } = useWallet();

  const balance = useSWR(
    {
      mintAddress,
      addresses,
    },
    async ({ mintAddress, addresses }) => {
      const [solanaAddress] = addresses;
      if (!solanaAddress) {
        return 0;
      }
      const mintAddressPublicKey = new PublicKey(mintAddress);
      const solanaAddressPublicKey = new PublicKey(solanaAddress);
      const associatedAddress = await getAssociatedTokenAddress(
        mintAddressPublicKey,
        solanaAddressPublicKey,
      );

      try {
        // Fetch the balance from the blockchain
        const balance = await sdk.request({
          method: "getTokenAccountBalance",
          params: [associatedAddress.toBase58()],
          chain: "solana",
        });
        return balance.value.uiAmountString as string;
      } catch (error) {
        if (error.message.includes("could not find account")) {
          return 0;
        }
        throw error;
      }
    },
    {
      refreshInterval: 10000,
    },
  );

  return {
    balance: balance.data,
    isLoading: balance.isLoading,
    error: balance.error,
  };
}
