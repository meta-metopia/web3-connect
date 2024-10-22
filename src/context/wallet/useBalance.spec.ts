import { lamportsToSol } from "./useBalance";

describe("should be able to parse lamports to sol", () => {
  const testCases = [
    {
      lamports: 499884996,
      expected: 0.499884996,
    },
  ];

  testCases.forEach((tc) => {
    it(`should be able to parse ${tc.lamports} to ${tc.expected}`, () => {
      expect(lamportsToSol(tc.lamports)).toBe(tc.expected);
    });
  });
});
