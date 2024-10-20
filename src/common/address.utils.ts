import { PublicKey } from "@solana/web3.js";

export function arrayToHex(uint8arr: Uint8Array): string {
  return Array.from(uint8arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToArray(hexString: string): Uint8Array {
  const matches = hexString.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map((byte) => Number.parseInt(byte, 16)));
}

export function convertSolanaAddressStringToUint8Array(
  address: string,
): Uint8Array {
  const pk = new PublicKey(address);
  return pk.toBytes();
}
