import { SupportedChain } from "../sdk";

export function ethereumCompatibleChainList(): SupportedChain[] {
  return ["ethereum", "bnb", "arbitrum", "optimism", "avalanche-c", "polygon"];
}

/**
 * Check if the chain is Ethereum compatible
 * @param chain The chain to check
 * @returns `true` if the chain is Ethereum compatible, `false` otherwise
 */
export function isEthereumCompatibleChain(chain: SupportedChain): boolean {
  return ethereumCompatibleChainList().includes(chain);
}
