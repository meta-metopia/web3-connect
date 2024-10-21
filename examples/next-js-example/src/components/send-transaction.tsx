"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWallet } from "web3-connect-react";
import * as z from "zod";

import SupportedChainsSelector from "@/components/supported-chains";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Toast } from "next/dist/client/components/react-dev-overlay/internal/components/Toast";

const formSchema = z.object({
  recipient: z.string(),
  amount: z.string(),
});

export default function SendTransaction() {
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [isLoading, setIsLoading] = useState(false);
  const { sdk } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      recipient: "",
      amount: "0",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!sdk.provider) {
      toast.error("Wallet not connected");
      return;
    }

    setIsLoading(true);
    await sdk
      .sendTransaction({
        to: values.recipient,
        value: values.amount,
        chain: selectedChain as any,
        rpcUrl: "https://api.testnet.solana.com",
      })
      .then((hash) => {
        toast.success(`Transaction sent successfully! ${hash}`);
        form.reset();
      })
      .catch((e) => {
        alert(e.message);
        setIsLoading(false);
      })
      .finally(() => setIsLoading(false));
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Send Transaction</CardTitle>
        <CardDescription>Send crypto to another address.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {sdk.provider && (
              <SupportedChainsSelector
                selectedOption={selectedChain}
                setSelectedOption={setSelectedChain}
                provider={sdk.provider}
              />
            )}
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the recipients wallet address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the amount to send. ( wei in Ethereum, lamports in
                    Solana, etc. )
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <Toast />
    </Card>
  );
}
