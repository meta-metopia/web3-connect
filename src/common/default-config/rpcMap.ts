import { SupportedChain } from "../../sdk";
import { arbitrumRpcUrl } from "./arbitrum.default.config";
import { avalancheCRpcUrl } from "./avalanche-c.default.config";
import { bnbRpcUrl } from "./bnb.default.config";
import { opRpcUrl } from "./op.default.config";
import { polygonRpcUrl } from "./polygon.default.config";

export const rpcMap: Record<
  Exclude<SupportedChain, "solana" | "ethereum">,
  string
> = {
  optimism: opRpcUrl,
  polygon: polygonRpcUrl,
  arbitrum: arbitrumRpcUrl,
  bnb: bnbRpcUrl,
  "avalanche-c": avalancheCRpcUrl,
};
