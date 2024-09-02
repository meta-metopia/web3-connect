/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.tsx"],
  moduleNameMapper: {
    "^jose": require.resolve("jose"),
    "@web3modal/ethers": require.resolve("@web3modal/ethers"),
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
