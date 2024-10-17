"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { abi, bytecode } from "@/lib/contract";
import { Loader2, RefreshCw, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useWallet } from "web3-connect-react";

export function ContractInteract() {
  const { sdk, walletAddress } = useWallet();
  const [value, setValue] = useState<string>("");
  const [currentBalance, setCurrentBalance] = useState<string>("");
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  const deployContract = async () => {
    if (!sdk || !sdk.provider) {
      return;
    }
    try {
      setIsDeploying(true);
      const address = await sdk
        .deployContract(abi, bytecode)
        .finally(() => setIsDeploying(false));
      sessionStorage.setItem("contractAddress", address);
      setContractAddress(address);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  const deleteContract = () => {
    sessionStorage.removeItem("contractAddress");
    setContractAddress(null);
  };

  const getBalance = async () => {
    if (!walletAddress || !sdk || !sdk.provider || !contractAddress) {
      return;
    }
    try {
      setIsRefreshing(true);
      const result = await sdk.callContractMethod(
        contractAddress,
        abi,
        "balanceOf",
        [walletAddress],
      );
      setCurrentBalance(result);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const mint = async () => {
    if (!walletAddress || !sdk || !sdk.provider || !contractAddress) {
      return;
    }
    try {
      setIsMinting(true);
      await sdk.callContractMethod(contractAddress, abi, "mint", [
        walletAddress,
        value,
      ]);
      await getBalance();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsMinting(false);
    }
  };

  useEffect(() => {
    const contractAddress = sessionStorage.getItem("contractAddress");
    setContractAddress(contractAddress);

    if (contractAddress) getBalance();
  }, [sdk, walletAddress, sdk.provider, contractAddress]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold justify-between flex flex-row">
          <span>Interact with Contract</span>
          <Button
            variant={"outline"}
            onClick={deleteContract}
            disabled={!contractAddress}
          >
            <Trash />
          </Button>
        </CardTitle>
      </CardHeader>
      {!contractAddress && (
        <CardContent>
          <Button
            onClick={deployContract}
            disabled={isDeploying || !sdk || !sdk.provider}
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              "Deploy Contract"
            )}
          </Button>
        </CardContent>
      )}
      {contractAddress && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Enter an amount
            </label>
            <Input
              id="amount"
              placeholder="Enter an amount"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Current balance: {currentBalance}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={getBalance}
              disabled={isRefreshing || !walletAddress || !sdk || !sdk.provider}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh balance</span>
            </Button>
          </div>
          <Button
            className="w-full"
            onClick={() => mint()}
            disabled={isMinting || value.length === 0}
          >
            {isMinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              "Mint"
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
