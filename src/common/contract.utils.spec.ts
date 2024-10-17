import { Address } from "@ethereumjs/util";
import { Account } from "@ethereumjs/util";
import { VM } from "@ethereumjs/vm";
import { ethers } from "ethers";
import solc from "solc";
import { callContractMethod, deployContract } from "./contract.utils"; // Replace with the actual import path

describe("callContractMethod", () => {
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
      expectedInitialValue: "0",
      expectedValueAfterSet: "42",
      setMethod: "setValue",
      getMethod: "getValue",
      setValues: [42],
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
    },
  ];

  testCases.forEach((testCase, index) =>
    describe(`with a contract: ${index}`, () => {
      beforeAll(async () => {
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
        abi = contract.abi;
        bytecode = contract.evm.bytecode.object;

        // Create a random wallet
        const wallet = ethers.Wallet.createRandom();
        fromAddress = wallet.address;

        // Set up VM
        vm = await VM.create();

        // Set up account with balance
        const account = Account.fromAccountData({ balance: 10n ** 18n });
        await vm.stateManager.putAccount(
          Address.fromString(fromAddress),
          account,
        );

        // Deploy contract
        const result = await vm.evm.runCall({
          to: undefined,
          caller: Address.fromString(fromAddress),
          origin: Address.fromString(fromAddress),
          data: Buffer.from(bytecode, "hex"),
          gasLimit: 2000000n,
          value: 0n,
        });

        contractAddress = result.createdAddress!.toString();
      });

      const mockProvider = {
        request: jest.fn(
          async ({ method, params }: { method: string; params: any[] }) => {
            if (method === "eth_call") {
              const [txParams, blockTag] = params;
              const result = await vm.evm.runCall({
                to: Address.fromString(txParams.to),
                caller: Address.fromString(fromAddress),
                origin: Address.fromString(fromAddress),
                data: Buffer.from(txParams.data.slice(2), "hex"),
                gasLimit: 2000000n,
                value: 0n,
              });
              return result.execResult.returnValue;
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
              return "0x" + result.execResult.returnValue.toString();
            } else if (method === "eth_getTransactionReceipt") {
              return {
                status: "0x1", // Success
                transactionHash: params[0],
                blockNumber: 1,
              };
            }
          },
        ),
      };

      test("should call a read-only contract method", async () => {
        const result = await callContractMethod({
          provider: mockProvider as any,
          contractAddress,
          abi,
          methodName: testCase.getMethod,
          fromAddress,
        });

        expect(result).toBe(testCase.expectedInitialValue);
        expect(mockProvider.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "eth_call",
            params: expect.arrayContaining([expect.any(Object), "latest"]),
          }),
        );
      });

      test("should call a state-changing contract method", async () => {
        const txHash = await callContractMethod({
          provider: mockProvider as any,
          contractAddress,
          abi,
          methodName: "setValue",
          fromAddress,
          params: testCase.setValues,
        });

        expect(typeof txHash).toBe("string");
        expect(mockProvider.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "eth_sendTransaction",
            params: expect.arrayContaining([expect.any(Object)]),
          }),
        );

        // Verify the state change
        const newValue = await callContractMethod({
          provider: mockProvider as any,
          contractAddress,
          abi,
          methodName: "getValue",
          fromAddress,
        });

        expect(newValue).toBe(testCase.expectedValueAfterSet);
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
          return "0x" + result.createdAddress!.toString();
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
