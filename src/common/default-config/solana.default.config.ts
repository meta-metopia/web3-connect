import { clusterApiUrl } from "@solana/web3.js";

export interface SolanaDefaultConfig {
  rpcUrl?: string;
}

export const defaultConfig: SolanaDefaultConfig = {
  rpcUrl: clusterApiUrl("mainnet-beta"),
};
