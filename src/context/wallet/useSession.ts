import { useContext } from "react";
import { WalletContext } from "./WalletContext";

/**
 * Use session hook will return the current session
 * @returns The current session
 */
export function useSession() {
  const { options } = useContext(WalletContext);
  const { session } = options;

  return session;
}
