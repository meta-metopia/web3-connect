import { useContext } from "react";
import { WalletContext } from "./WalletContext";

export function useWallet() {
  const {
    isLoading,
    isSignedIn,
    chainId,
    balance,
    sdk,
    session,
    signIn,
    signOut,
    switchNetwork,
  } = useContext(WalletContext);

  return {
    isLoading,
    isSignedIn,
    chainId,
    balance,
    session,
    sdk,
    signIn,
    signOut,
    switchNetwork,
  };
}
