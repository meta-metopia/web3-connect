import { nu64, struct, u8 } from "@solana/buffer-layout";
import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  TEST_TIMEOUT,
  createFundedKeypair,
  getTestConnection,
} from "../../setupTests";
import { callSolanaProgram } from "./contract.solana.utils";

describe.skip("SPL Token E2E Tests", () => {
  let connection: Connection;
  let payer: Keypair;
  let mintAuthority: Keypair;
  let freezeAuthority: Keypair;
  let mint: PublicKey;
  let provider: any;
  let recipientKeypair: Keypair;
  let recipientTokenAccount: PublicKey;

  beforeAll(async () => {
    connection = getTestConnection();
    payer = await createFundedKeypair(connection);
    mintAuthority = await createFundedKeypair(connection);
    freezeAuthority = await createFundedKeypair(connection);
    recipientKeypair = await createFundedKeypair(connection);

    provider = {
      publicKey: payer.publicKey,
      signAndSendTransaction: async (transaction: Transaction) => {
        transaction.feePayer = payer.publicKey;
        transaction.recentBlockhash = (
          await connection.getRecentBlockhash()
        ).blockhash;

        // Sign with both payer and mint authority
        transaction.sign(payer, mintAuthority);
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
        );

        return { signature };
      },
    };

    // Create the mint
    mint = await createMint(
      connection,
      payer,
      mintAuthority.publicKey,
      freezeAuthority.publicKey,
      9,
    );

    // Create recipient token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      recipientKeypair.publicKey,
    );
    recipientTokenAccount = tokenAccount.address;

    const mintInfo = await getMint(connection, mint);
    expect(mintInfo.decimals).toBe(9);
  }, TEST_TIMEOUT);

  test(
    "should mint tokens using mintTo instruction",
    async () => {
      const mintAmount = 1000000000n; // 1 token with 9 decimals

      // Define the layout for MintTo instruction
      const mintToLayout = struct([
        // @ts-ignore
        u8("instruction"), // 7 for MintTo
        // @ts-ignore
        nu64("amount"),
      ]);

      const options = {
        contractAddress: mint.toBase58(),
        method: 7, // MintTo instruction index
        chain: "solana" as const,
        connection,
        provider,
        layout: mintToLayout,
        params: [mintAmount], // amount to mint
        accounts: {
          mint: mint,
          destination: recipientTokenAccount,
          authority: mintAuthority.publicKey,
        },
      };

      // Get initial balance
      const initialAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        recipientKeypair.publicKey,
      );
      const initialBalance = initialAccount.amount;

      // Execute mintTo instruction
      const signature = await callSolanaProgram(options);
      expect(signature).toBeTruthy();

      // Wait for confirmation and get logs
      const confirmation = await connection.confirmTransaction(signature);
      expect(confirmation.value.err).toBeNull();

      // Get transaction logs
      const txDetails = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      console.log("Transaction Logs:", txDetails?.meta?.logMessages);

      // Verify token balance increased
      const finalAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        recipientKeypair.publicKey,
      );
      expect(finalAccount.amount - initialBalance).toBe(mintAmount);
    },
    TEST_TIMEOUT,
  );

  test(
    "should fail minting with wrong authority",
    async () => {
      const mintAmount = 1000000000n;

      const mintToLayout = struct([
        // @ts-ignore
        u8("instruction"),
        // @ts-ignore
        nu64("amount"),
      ]);

      const options = {
        contractAddress: mint.toBase58(),
        method: 7,
        chain: "solana" as const,
        connection,
        provider: {
          ...provider,
          // Override signAndSendTransaction to only sign with payer
          signAndSendTransaction: async (transaction: Transaction) => {
            transaction.feePayer = payer.publicKey;
            transaction.recentBlockhash = (
              await connection.getRecentBlockhash()
            ).blockhash;

            // Only sign with payer, not mint authority
            transaction.sign(payer);
            const signature = await connection.sendRawTransaction(
              transaction.serialize(),
            );

            return { signature };
          },
        },
        layout: mintToLayout,
        params: [mintAmount],
        accounts: {
          mint: mint,
          destination: recipientTokenAccount,
          authority: payer.publicKey, // Wrong authority
        },
      };

      try {
        await callSolanaProgram(options);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
        if ("logs" in error) {
          console.log("Error logs:", error.logs);
        }
      }
    },
    TEST_TIMEOUT,
  );

  // Helper to get token balance
  async function getTokenBalance(tokenAccount: PublicKey): Promise<bigint> {
    const account = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      recipientKeypair.publicKey,
    );
    return account.amount;
  }
});
