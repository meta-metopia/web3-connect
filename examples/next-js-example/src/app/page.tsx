"use client";

import { ContractInteract } from "@/components/contract-interact";
import SendTransaction from "@/components/send-transaction";
import SignMessageExample from "@/components/sign-message";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletConnect } from "@/components/wallet-connect";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "web3-connect-react";

export default function Home() {
  const { isSignedIn } = useWallet();

  return (
    <div className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 h-full min-h-full flex-1">
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
        <div className={"col-span-3 md:col-span-1"}>
          <WalletConnect />
        </div>
        <div className={"col-span-3 md:col-span-2"}>
          <AnimatePresence mode="wait">
            {isSignedIn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Tabs
                  defaultValue={"smart-contract"}
                  className="bg-white border rounded-xl overflow-hidden"
                >
                  <TabsList className="m-5">
                    <TabsTrigger
                      value="smart-contract"
                      className="px-4 py-2 rounded-md"
                    >
                      Interact with Contract
                    </TabsTrigger>
                    <TabsTrigger
                      value="transactions"
                      className="px-4 py-2 rounded-md"
                    >
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger
                      value="sign-message"
                      className="px-4 py-2 rounded-md"
                    >
                      Sign Message
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="smart-contract" className="p-6">
                    <ContractInteract />
                  </TabsContent>
                  <TabsContent value="transactions" className="p-6">
                    <SendTransaction />
                  </TabsContent>
                  <TabsContent value="sign-message" className="p-6">
                    <SignMessageExample />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
