import { Structure } from "@solana/buffer-layout";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { CallSolanaContractMethodOptions, SolanaProvider } from "../../sdk";

export function waitForSolanaTransactionFinished(
  connection: Connection,
  signature: string,
) {
  return new Promise((resolve, reject) => {
    const checkSignature = async () => {
      const { value } = await connection.getSignatureStatus(signature);
      const confirmationStatus = value?.confirmationStatus;
      if (confirmationStatus) {
        const hasReachedSufficientCommitment =
          confirmationStatus === "confirmed" ||
          confirmationStatus === "finalized";
        if (hasReachedSufficientCommitment) {
          resolve(void 0);
          return;
        }
      }
      setTimeout(checkSignature, 1000);
    };
    checkSignature();
  });
}

class InstructionData {}

function createInstructionData(
  instructionIndex: number,
  layout?: Structure<any>,
  params: any[] = [],
): Buffer {
  if (!layout) {
    // If no layout provided, just use the instruction index
    return Buffer.from([instructionIndex]);
  }

  // Create instruction data object
  const data: InstructionData = {
    instruction: instructionIndex,
    ...params.reduce(
      (acc, param, index) => ({
        // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
        ...acc,
        [`param${index}`]: param,
      }),
      {},
    ),
  };

  // Encode the data using the provided layout
  const buffer = Buffer.alloc(1000); // Allocate enough space
  const length = layout.encode(data, buffer);

  return buffer.slice(0, length);
}

function createInstruction(
  programId: PublicKey,
  methodIndex: number,
  accounts: Record<string, PublicKey>,
  layout?: Structure<any>,
  params?: any[],
): TransactionInstruction {
  // Convert accounts object to AccountMeta array
  const keys = Object.entries(accounts).map(([key, pubkey]) => ({
    pubkey,
    isSigner:
      key.toLowerCase().includes("authority") ||
      key.toLowerCase().includes("owner") ||
      key.toLowerCase().includes("signer"),
    isWritable:
      !key.toLowerCase().includes("program") &&
      !key.toLowerCase().includes("authority") &&
      !key.toLowerCase().includes("owner"),
  }));

  return new TransactionInstruction({
    programId,
    keys,
    data: createInstructionData(methodIndex, layout, params),
  });
}

export async function callSolanaProgram(
  opts: CallSolanaContractMethodOptions & {
    connection: Connection;
    provider: SolanaProvider;
  },
): Promise<string> {
  const programId = new PublicKey(opts.contractAddress);
  const transaction = new Transaction();

  if (opts.instructions && opts.instructions.length > 0) {
    transaction.add(...opts.instructions);
  } else {
    // Convert method to number if it's a string
    const methodIndex = opts.method;

    // Create instruction using provided layout and params
    const instruction = createInstruction(
      programId,
      methodIndex,
      opts.accounts || {},
      opts.layout,
      opts.params,
    );
    transaction.add(instruction);
  }

  if (opts.value) {
    const pk = await opts.provider.connect();
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: pk.publicKey,
      toPubkey: new PublicKey(opts.contractAddress),
      lamports: Number.parseInt(opts.value),
    });
    transaction.add(transferInstruction);
  }

  const { signature } = await opts.provider.signAndSendTransaction(transaction);
  await opts.connection.confirmTransaction(signature);
  return signature;
}
