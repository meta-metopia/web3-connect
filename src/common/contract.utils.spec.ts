import { Address } from "@ethereumjs/util";
import { Account, bytesToHex } from "@ethereumjs/util";
import { VM } from "@ethereumjs/vm";
import { ethers } from "ethers";
import solc from "solc";
import { callContractMethod, deployContract } from "./contract.utils"; // Replace with the actual import path

const originalFetch = global.fetch;

describe("callContractMethod with custom rpc", () => {
  let vm: VM;
  let contractAddress: string;
  let fromAddress: string;
  let abi: any[];
  let bytecode: string;

  const testCases = [
    {
      contractSource: `
    pragma solidity ^0.8.0;
    
    contract SimpleStorage {
      uint256 private value;
    
      function setValue(uint256 _value) public {
        value = _value;
      }
    
      function getValue() public view returns (uint256) {
        return value;
      }
    }
  `,
      expectedInitialValue: 0n,
      expectedValueAfterSet: 42n,
      setMethod: "setValue",
      getMethod: "getValue",
      setValues: [42n],
      rpcUrl: "https://eth-mainnet.example.com",
    },
    {
      contractSource: `
    pragma solidity ^0.8.0;
    
    contract SimpleStorage {
      address private value;
    
      function setValue(address _value) public {
        value = _value;
      }
    
      function getValue() public view returns (address) {
        return value;
      }
    }
  `,
      expectedInitialValue: "0x0000000000000000000000000000000000000000",
      expectedValueAfterSet: "0x152b7209148Ef144D014491877f5535FEf260941",
      setMethod: "setValue",
      getMethod: "getValue",
      setValues: ["0x152b7209148Ef144D014491877f5535FEf260941"],
      rpcUrl: "https://eth-sepolia.example.com",
    },
  ];

  testCases.forEach((testCase, index) =>
    describe(`with a contract: ${index} on RPC: ${testCase.rpcUrl}`, () => {
      beforeAll(async () => {
        // Set up VMs
        vm = await VM.create();

        const wallet = ethers.Wallet.createRandom();
        fromAddress = wallet.address;

        // Set up accounts
        const account = Account.fromAccountData({ balance: 10n ** 18n });
        await vm.stateManager.putAccount(
          Address.fromString(fromAddress),
          account,
        );

        // Compile contract
        const input = {
          language: "Solidity",
          sources: {
            "SimpleStorage.sol": {
              content: testCase.contractSource,
            },
          },
          settings: {
            outputSelection: {
              "*": {
                "*": ["*"],
              },
            },
          },
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));
        const contract = output.contracts["SimpleStorage.sol"]["SimpleStorage"];
        abi = contract.abi;
        bytecode = contract.evm.bytecode.object;

        // Deploy on both VMs
        const result = await vm.evm.runCall({
          to: undefined,
          caller: Address.fromString(fromAddress),
          origin: Address.fromString(fromAddress),
          data: Buffer.from(bytecode, "hex"),
          gasLimit: 2000000n,
          value: 0n,
        });

        contractAddress = result.createdAddress!.toString();

        await vm.evm.runCall({
          to: undefined,
          caller: Address.fromString(fromAddress),
          origin: Address.fromString(fromAddress),
          data: Buffer.from(bytecode, "hex"),
          gasLimit: 2000000n,
          value: 0n,
        });
      });

      beforeEach(() => {
        // Mock fetch with fixed response format
        global.fetch = jest
          .fn()
          .mockImplementation(async (url: string, options: any) => {
            const { method, body } = options;
            const requestBody = JSON.parse(body);

            let responseData;

            if (requestBody.method === "eth_call") {
              const [txParams] = requestBody.params;
              const result = await vm.evm.runCall({
                to: Address.fromString(txParams.to),
                caller: Address.fromString(fromAddress),
                origin: Address.fromString(fromAddress),
                data: Buffer.from(txParams.data.slice(2), "hex"),
                gasLimit: 2000000n,
                value: 0n,
              });

              // Ensure proper hex formatting of the return value
              const returnValue = bytesToHex(
                result.execResult.returnValue as any,
              );

              responseData = {
                jsonrpc: "2.0",
                id: requestBody.id,
                result: returnValue,
              };
            } else if (requestBody.method === "eth_getTransactionReceipt") {
              responseData = {
                jsonrpc: "2.0",
                id: requestBody.id,
                result: {
                  status: "0x1",
                  transactionHash: requestBody.params[0],
                  blockNumber: "0x1",
                },
              };
            }

            return {
              ok: true,
              json: async () => responseData,
            };
          });
      });

      const createMockProvider = (vmInstance = vm) => ({
        request: jest.fn(
          async ({ method, params }: { method: string; params: any[] }) => {
            if (method === "eth_call") {
              const [txParams, blockTag] = params;
              const result = await vmInstance.evm.runCall({
                to: Address.fromString(txParams.to),
                caller: Address.fromString(fromAddress),
                origin: Address.fromString(fromAddress),
                data: Buffer.from(txParams.data.slice(2), "hex"),
                gasLimit: 2000000n,
                value: 0n,
              });
              // Properly format the return value
              const tx = bytesToHex(result.execResult.returnValue as any);
              return tx;
            } else if (method === "eth_sendTransaction") {
              const [txParams] = params;
              const result = await vm.evm.runCall({
                to: Address.fromString(txParams.to),
                caller: Address.fromString(txParams.from),
                origin: Address.fromString(txParams.from),
                data: Buffer.from(txParams.data.slice(2), "hex"),
                gasLimit: 2000000n,
                value: txParams.value ? BigInt(txParams.value) : 0n,
              });
              // Generate a proper transaction hash
              const tx = bytesToHex(result.execResult.returnValue);
              return tx;
            } else if (method === "eth_getTransactionReceipt") {
              return {
                status: "0x1",
                transactionHash: params[0],
                blockNumber: "0x1",
              };
            } else if (method === "eth_accounts") {
              return [fromAddress];
            } else if (method === "eth_chainId") {
              return "0x1";
            } else if (method === "eth_blockNumber") {
              return "0x1";
            } else if (method === "eth_estimateGas") {
              return "0x1";
            } else if (method === "eth_getTransactionByHash") {
              return {
                blockHash:
                  "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
                blockNumber: "0x1",
                from: "0x360E63ED24Dde6aF3415CAE6145BaCAA683A0373",
                gas: "0x5208", // 21000 in hex (standard gas for transfers)
                gasPrice: "0x4a817c800", // 20 Gwei in hex
                hash: "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
                input: "0x", // Empty input for basic transfer
                nonce: "0x1",
                to: "0x60d9b7b958ba27d828c2993fa9bc1c1fee802da7",
                transactionIndex: "0x1",
                value: "0x0",
                // ECDSA signature components
                v: "0x1b", // Valid v value for mainnet
                r: "0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
                s: "0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
              };
            }
          },
        ),
      });

      afterEach(() => {
        // Restore fetch after each test
        global.fetch = originalFetch;
        jest.clearAllMocks();
      });

      test("should call read-only method using custom RPC", async () => {
        const mockProvider = createMockProvider();
        const result = await callContractMethod({
          provider: mockProvider as any,
          rpcUrl: testCase.rpcUrl,
          contractAddress,
          abi,
          methodName: testCase.getMethod,
          fromAddress,
        });

        expect(result).toBe(testCase.expectedInitialValue);
        expect(global.fetch).toHaveBeenCalledWith(
          testCase.rpcUrl,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.any(String),
          }),
        );
      });

      test("should call state-changing method with custom RPC for reading", async () => {
        const mockProvider = createMockProvider();

        // Set value
        const txHash = await callContractMethod({
          provider: mockProvider as any,
          rpcUrl: testCase.rpcUrl,
          contractAddress,
          abi,
          methodName: testCase.setMethod,
          fromAddress,
          params: testCase.setValues,
        });

        expect(typeof txHash).toBe("string");
        expect(mockProvider.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "eth_sendTransaction",
          }),
        );

        // Read value using custom RPC
        const newValue = await callContractMethod({
          provider: mockProvider as any,
          rpcUrl: testCase.rpcUrl,
          contractAddress,
          abi,
          methodName: testCase.getMethod,
          fromAddress,
        });

        expect(newValue).toBe(testCase.expectedValueAfterSet);
        expect(global.fetch).toHaveBeenCalledWith(
          testCase.rpcUrl,
          expect.any(Object),
        );
      });

      test("should handle RPC errors", async () => {
        const mockProvider = createMockProvider();
        global.fetch = jest.fn().mockRejectedValue(new Error("RPC Error"));

        await expect(
          callContractMethod({
            provider: mockProvider as any,
            rpcUrl: testCase.rpcUrl,
            contractAddress,
            abi,
            methodName: testCase.getMethod,
            fromAddress,
          }),
        ).rejects.toThrow("RPC Error");
      });
    }),
  );
});

describe("deployContract", () => {
  let vm: VM;
  let fromAddress: string;
  let contractAddress: string;

  const testCases = [
    {
      name: "Contract without constructor parameters",
      contractSource: `
        pragma solidity ^0.8.0;
        
        contract SimpleStorage {
          uint256 private value;
        
          function setValue(uint256 _value) public {
            value = _value;
          }
        
          function getValue() public view returns (uint256) {
            return value;
          }
        }
      `,
      params: [],
    },
    {
      name: "Contract with constructor parameters",
      contractSource: `
        pragma solidity ^0.8.0;
        
        contract SimpleStorage {
          uint256 private value;
        
          constructor(uint256 initialValue) {
            value = initialValue;
          }
        
          function setValue(uint256 _value) public {
            value = _value;
          }
        
          function getValue() public view returns (uint256) {
            return value;
          }
        }
      `,
      params: [42],
    },
  ];

  beforeAll(async () => {
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    fromAddress = wallet.address;

    // Set up VM
    vm = await VM.create();

    // Set up account with balance
    const account = Account.fromAccountData({ balance: 10n ** 18n });
    await vm.stateManager.putAccount(Address.fromString(fromAddress), account);
  });

  const mockProvider = {
    request: jest.fn(
      async ({ method, params }: { method: string; params: any[] }) => {
        if (method === "eth_sendTransaction") {
          const [txParams] = params;
          const result = await vm.evm.runCall({
            to: undefined, // For contract deployment
            caller: Address.fromString(txParams.from),
            origin: Address.fromString(txParams.from),
            data: Buffer.from(txParams.data.slice(2), "hex"),
            gasLimit: 2000000n,
            value: txParams.value ? BigInt(txParams.value) : 0n,
          });
          contractAddress = result.createdAddress!.toString();
          return result.createdAddress!.toString();
        } else if (method === "eth_getTransactionReceipt") {
          return {
            status: "0x1", // Success
            transactionHash: params[0],
            blockNumber: 1,
            contractAddress: contractAddress,
          };
        }
      },
    ),
  };

  testCases.forEach((testCase) => {
    test(`should deploy ${testCase.name}`, async () => {
      // Compile the contract
      const input = {
        language: "Solidity",
        sources: {
          "SimpleStorage.sol": {
            content: testCase.contractSource,
          },
        },
        settings: {
          outputSelection: {
            "*": {
              "*": ["*"],
            },
          },
        },
      };

      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      const contract = output.contracts["SimpleStorage.sol"]["SimpleStorage"];
      const abi = contract.abi;
      const bytecode = contract.evm.bytecode.object;

      // Deploy the contract
      const deployedAddress = await deployContract({
        provider: mockProvider as any,
        abi,
        bytecode,
        fromAddress,
        params: testCase.params,
      });

      // Verify the deployed contract address
      expect(typeof deployedAddress).toBe("string");
      expect(deployedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Verify that eth_sendTransaction was called
      expect(mockProvider.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "eth_sendTransaction",
          params: expect.arrayContaining([
            expect.objectContaining({
              from: fromAddress,
              data: expect.any(String),
            }),
          ]),
        }),
      );

      // Verify that eth_getTransactionReceipt was called
      expect(mockProvider.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "eth_getTransactionReceipt",
          params: expect.any(Array),
        }),
      );
    });
  });
});
