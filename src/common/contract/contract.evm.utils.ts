import { BrowserProvider, ethers } from "ethers";
import { EIP1193Provider } from "../../providers";
import { SupportedChain } from "../../sdk";

interface CallContractMethodParams {
  provider: EIP1193Provider;
  contractAddress: string;
  abi: any[];
  methodName: string;
  fromAddress?: string;
  params?: any[];
  value?: string;
  chain?: SupportedChain;
  waitInterval?: number;
  timeout?: number;
  rpcUrl?: string;
}

interface DeployContractParams {
  provider: EIP1193Provider;
  abi: any[];
  bytecode: string;
  fromAddress: string;
  params?: any[];
  value?: string;
  chain?: SupportedChain;
  waitInterval?: number;
  timeout?: number;
  rpcUrl?: string;
}

const DEFAULT_WAIT_INTERVAL = 1000;
const DEFAULT_TIMEOUT = 60000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CustomEthereumProvider extends BrowserProvider {
  private readonly rpcUrl: string | undefined;

  constructor(provider: EIP1193Provider, rpcUrl?: string) {
    super(provider);
    this.rpcUrl = rpcUrl;
  }

  async send(method: string, params: Array<any>): Promise<any> {
    // Use custom RPC for read operations
    if (
      this.rpcUrl &&
      (method === "eth_call" || method === "eth_getTransactionReceipt")
    ) {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method,
          params,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      return data.result;
    }

    // Use original provider for all other operations
    return super.send(method, params);
  }
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
 * @param rpcUrl RPC url if using provider such as `op`, `polygon`, etc.
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
  rpcUrl,
}: CallContractMethodParams): Promise<string> {
  const runner = new CustomEthereumProvider(provider, rpcUrl);
  const contract = new ethers.Contract(contractAddress, abi, runner);

  // Determine if the function is read-only
  const functionFragment = contract.interface.getFunction(methodName);
  const isReadOnly =
    functionFragment.stateMutability === "view" ||
    functionFragment.stateMutability === "pure";

  const signer = await runner.getSigner(fromAddress);
  const connectedContract = contract.connect(signer);
  if (isReadOnly) {
    // Use eth_call for read-only functions
    if (params) {
      return await connectedContract[methodName](...params);
    }
    return await connectedContract[methodName]();
  }
  // Use eth_sendTransaction for state-changing functions
  let tx: any;
  if (params) {
    tx = await connectedContract[methodName](...params, {
      value: value ? ethers.parseEther(value) : undefined,
    });
  } else {
    tx = await connectedContract[methodName]({
      value: value ? ethers.parseEther(value) : undefined,
    });
  }

  const txHash = tx.hash;

  // Wait for the transaction to be mined
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const receipt = await runner.send("eth_getTransactionReceipt", [txHash]);

    if (receipt?.status === "0x1") {
      return txHash;
    }

    if (receipt?.status === "0x0") {
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
  const runner = new CustomEthereumProvider(provider);
  const factory = new ethers.ContractFactory(abi, bytecode, runner);

  // Encode the constructor parameters
  const deployData = factory.interface.encodeDeploy(params);

  // Combine bytecode and encoded constructor parameters
  const fullBytecode = bytecode + deployData.slice(2);

  // Use eth_sendTransaction for contract deployment
  const txHash = await runner.send("eth_sendTransaction", [
    {
      from: fromAddress,
      data: fullBytecode,
      value: value ? ethers.parseEther(value).toString(16) : undefined, // Convert to hex if value is provided
    },
  ]);
  // Wait for the transaction to be mined
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const receipt = await runner.send("eth_getTransactionReceipt", [txHash]);

    if (receipt?.status === "0x1") {
      return receipt.contractAddress;
    }

    if (receipt?.status === "0x0") {
      throw new Error("Transaction failed");
    }

    await sleep(waitInterval);
  }

  throw new Error("Contract deployment timed out");
}
