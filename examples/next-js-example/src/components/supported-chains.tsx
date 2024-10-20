import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupportedChain } from "web3-connect-react";

interface SupportedChainsSelectorProps {
  selectedOption: string;
  setSelectedOption: (value: string) => void;
}

const supportedChains: SupportedChain[] = ["solana", "ethereum"];

export default function SupportedChainsSelector({
  selectedOption,
  setSelectedOption,
}: SupportedChainsSelectorProps) {
  return (
    <Select value={selectedOption} onValueChange={setSelectedOption}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {supportedChains.map((chain) => (
          <SelectItem value={chain} key={chain}>
            {chain}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
