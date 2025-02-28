import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { createFundedKeypair, getTestConnection } from "../setupTests";
import { MultiWalletProvider } from "./multi-wallet.provider";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("sign message", () => {
  let walletProvider: MultiWalletProvider;
  let walletAddress: string;
  beforeEach(() => {
    const solanaKeypair = Keypair.fromSecretKey(
      Uint8Array.from([
        174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31,
        56, 222, 53, 138, 189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251,
        237, 246, 15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141,
        89, 240, 121, 121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109,
        168, 89, 238, 135,
      ]),
    );
    walletAddress = solanaKeypair.publicKey.toString();

    walletProvider = new MultiWalletProvider({
      multipleWallet: {
        solana: {
          connect: async () => {
            return {
              publicKey: solanaKeypair.publicKey,
            };
          },
          signMessage: async (messageBytes: Uint8Array) => {
            const signatures = nacl.sign.detached(
              messageBytes,
              solanaKeypair.secretKey,
            );
            return {
              signature: signatures,
            };
          },
        },
      },
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as any);
  });

  it("should be able to sign and verify a message on Solana", async () => {
    const message = "test message";
    const signedMessage = await walletProvider.signMessage(message, {
      forAuthentication: true,
      chain: "solana",
    });

    expect(signedMessage).toBeDefined();

    const verifiedMessage = await walletProvider.verifyMessage({
      message,
      signature: signedMessage,
      walletAddress: walletAddress,
      chain: "solana",
    });
    expect(verifiedMessage).toBeTruthy();
  });

  it.skip("should be able to get balance", async () => {
    const balance = await walletProvider.getBalance({
      chains: ["ethereum", "bnb", "arbitrum"],
    });
    expect(balance).toHaveLength(4);
  });
});

describe("should be able to request on solana", () => {
  let connection: Connection;
  let payer: Keypair;
  let mintAuthority: Keypair;
  let freezeAuthority: Keypair;
  let mint: PublicKey;
  let walletProvider: MultiWalletProvider;

  beforeAll(async () => {
    connection = getTestConnection();
    payer = await createFundedKeypair(connection);
    mintAuthority = await createFundedKeypair(connection);
    freezeAuthority = await createFundedKeypair(connection);

    walletProvider = new MultiWalletProvider(
      {},
      {
        defaultChainConfigs: {
          solana: {
            rpcUrl: "http://localhost:8899",
          },
        },
      },
    );

    // Create the mint
    mint = await createMint(
      connection,
      payer,
      mintAuthority.publicKey,
      freezeAuthority.publicKey,
      9,
    );
  });

  it.skip("should be able to request all accounts", async () => {
    // create associated token account
    const tokenInfo = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey,
    );
    await mintTo(
      connection,
      payer,
      mint,
      tokenInfo.address,
      mintAuthority,
      1000,
    );
    const address = getAssociatedTokenAddressSync(mint, payer.publicKey);
    const result = await walletProvider.request({
      method: "getTokenAccountBalance",
      params: [address.toBase58()],
      chain: "solana",
    });
    console.log(result);
    expect(result).toBeDefined();
  });
});
