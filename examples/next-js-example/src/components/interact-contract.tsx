import { useAddresses, useWallet } from "web3-connect-react";
import abi from "./abi.json";

const contract = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

/**
 * This component allows user to upload a contract and interact with it.
 * It will parse the contract and display the contract's methods.
 * @constructor
 */
export default function InteractContract() {
  const getContractMethods = (abi: any) => {
    return abi.filter((method: any) => method.type === "function");
  };

  /**
   * Get list of parameters for a method
   * @param abi
   * @param method
   */
  const getParams = (abi: any, method: any) => {};

  const { sdk } = useWallet();
  const { addresses } = useAddresses("ethereum", "bnb");

  const getBalance = async () => {
    const result = await sdk.callContractMethod({
      method: "balanceOf",
      params: [addresses[0]],
      abi: abi,
      contractAddress: contract,
      chain: "bnb",
    });
    console.log(result);
  };

  return (
    <div>
      <button onClick={getBalance}>Get balance</button>
    </div>
  );
}
