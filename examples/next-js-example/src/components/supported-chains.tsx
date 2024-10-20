import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletProvider } from "web3-connect-react";

interface SupportedChainsSelectorProps {
  selectedOption: string;
  setSelectedOption: (value: string) => void;
  provider: WalletProvider;
}

export default function SupportedChainsSelector({
  selectedOption,
  setSelectedOption,
  provider,
}: SupportedChainsSelectorProps) {
  return (
    <Select value={selectedOption} onValueChange={setSelectedOption}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {provider.metadata.supportedChains.map((chain) => (
          <SelectItem value={chain} key={chain}>
            {chain}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
