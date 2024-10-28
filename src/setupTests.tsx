// @ts-ignore
global.ResizeObserver = class FakeResizeObserver {
  observe() {}
  disconnect() {}
};

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const TEST_TIMEOUT = 60000;
jest.setTimeout(TEST_TIMEOUT);

export const getTestConnection = () => {
  return new Connection("http://localhost:8899", "confirmed");
};

export const createFundedKeypair = async (
  connection: Connection,
): Promise<Keypair> => {
  const keypair = Keypair.generate();
  const airdropSignature = await connection.requestAirdrop(
    keypair.publicKey,
    10 * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(airdropSignature);
  return keypair;
};
