"use client";

import SupportedChainsSelector from "@/components/supported-chains";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PenIcon } from "lucide-react";
import { useState } from "react";
import { SupportedChain, useWallet } from "web3-connect-react";

export default function SignMessageExample() {
  const [message, setMessage] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("ethereum");
  const [result, setResult] = useState<string | null>(null);
  const { sdk, isSignedIn } = useWallet();

  const sign = async () => {
    if (!sdk || !isSignedIn) return;
    await sdk.provider
      .signMessage(message, {
        chain: selectedOption as SupportedChain,
      })
      .then((res) => {
        setResult(res);
      })
      .catch((e) => {
        alert(e.message);
        console.error(e);
      });
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center gap-2">
              <PenIcon className="h-6 w-6" />
              Sign Message
            </CardTitle>
            {sdk.provider && (
              <SupportedChainsSelector
                provider={sdk.provider}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
              />
            )}
          </div>
          <CardDescription>Sign a message using your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message to sign"
            className="min-h-[100px]"
          />
          {result && (
            <span className={"pt-2 break-all"}>
              <strong>Result:</strong> {JSON.stringify(result, null, 4)}
            </span>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={sign} disabled={!isSignedIn}>
            Sign
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
