import { BrowserProvider, ethers } from "ethers";
import { EIP1193Provider } from "../providers";

interface CallContractMethodParams {
  provider: EIP1193Provider;
  contractAddress: string;
  abi: any[];
  methodName: string;
  fromAddress?: string;
  params?: any[];
  value?: string;
  waitInterval?: number;
  timeout?: number;
}

interface DeployContractParams {
  provider: EIP1193Provider;
  abi: any[];
  bytecode: string;
  fromAddress: string;
  params?: any[];
  value?: string;
  waitInterval?: number;
  timeout?: number;
}

const DEFAULT_WAIT_INTERVAL = 1000;
const DEFAULT_TIMEOUT = 60000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call a contract method
 * @param provider The EIP-1193 provider
 * @param contractAddress The contract address
 * @param abi The contract ABI
 * @param methodName The method name
 * @param fromAddress The address to send the transaction from
 * @param params The method parameters
 * @param value The amount of Ether to send with the transaction
 * @param timeout
 * @param waitInterval
 */
export async function callContractMethod({
  provider,
  contractAddress,
  abi,
  methodName,
  fromAddress,
  params,
  value,
  timeout = DEFAULT_TIMEOUT,
  waitInterval = DEFAULT_WAIT_INTERVAL,
}: CallContractMethodParams): Promise<string> {
  const runner = new BrowserProvider(provider);
  const contract = new ethers.Contract(contractAddress, abi, runner);
  const data = contract.interface.encodeFunctionData(methodName, params);

  // Determine if the function is read-only
  const functionFragment = contract.interface.getFunction(methodName);
  const isReadOnly =
    functionFragment.stateMutability === "view" ||
    functionFragment.stateMutability === "pure";

  if (isReadOnly) {
    // Use eth_call for read-only functions
    const result = await provider.request({
      method: "eth_call",
      params: [
        {
          to: contractAddress,
          data: data,
        },
        "latest",
      ],
    });

    // Decode the result
    const decodedResult = contract.interface.decodeFunctionResult(
      methodName,
      result,
    );

    // If there's only one output, return it directly; otherwise, return the array
    return decodedResult.length === 1
      ? decodedResult[0].toString()
      : decodedResult.toString();
  }
  // Use eth_sendTransaction for state-changing functions
  const txHash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: fromAddress,
        to: contractAddress,
        data: data,
        value: value ? ethers.parseEther(value).toString(16) : undefined, // Convert to hex if value is provided
      },
    ],
  });

  // wait for the transaction to be mined
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const tx = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });

    if (tx?.status === "0x1") {
      return txHash;
    }

    if (tx?.status === "0x0") {
      throw new Error("Transaction failed");
    }
    await sleep(waitInterval);
  }

  return txHash;
}

export async function deployContract({
  provider,
  abi,
  bytecode,
  fromAddress,
  params,
  value,
  timeout = DEFAULT_TIMEOUT,
  waitInterval = DEFAULT_WAIT_INTERVAL,
}: DeployContractParams): Promise<string> {
  const runner = new BrowserProvider(provider);
  const factory = new ethers.ContractFactory(abi, bytecode, runner);

  // Encode the constructor parameters
  const deployData = factory.interface.encodeDeploy(params);

  // Combine bytecode and encoded constructor parameters
  const fullBytecode = bytecode + deployData.slice(2);

  // Use eth_sendTransaction for contract deployment
  const txHash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: fromAddress,
        data: fullBytecode,
        value: value ? ethers.parseEther(value).toString(16) : undefined, // Convert to hex if value is provided
      },
    ],
  });

  // Wait for the transaction to be mined
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const tx = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });

    if (tx?.status === "0x1") {
      // Contract deployed successfully
      return tx.contractAddress;
    }

    if (tx?.status === "0x0") {
      throw new Error("Contract deployment failed");
    }

    await sleep(waitInterval);
  }

  throw new Error("Contract deployment timed out");
}
