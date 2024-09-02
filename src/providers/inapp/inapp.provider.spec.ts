import {
  DesktopWithMetaMaskEnvironment,
  DesktopWithOKXEnvironment,
  MobileBrowserEnvironment,
  MobileMetaMaskEnvironment,
  MobileOKXEnvironment,
} from "../../test/environments";
import { InAppWalletProvider } from "./inapp.provider";

describe("InApp Provider test", () => {
  const testCases = [
    {
      name: "should not show InApp Provider in desktop browser and installed",
      mockEnvironment: DesktopWithMetaMaskEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should not show InApp Provider in desktop browser and not installed",
      mockEnvironment: DesktopWithOKXEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should not show InApp Provider in mobile browser",
      mockEnvironment: MobileBrowserEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should show InApp Provider in Mobile MetaMask",
      mockEnvironment: MobileMetaMaskEnvironment,
      expectedEnabled: true,
      expectedVisible: true,
      expectedProvider: true,
    },
    {
      name: "should not show InApp Provider in Mobile OKX wallet",
      mockEnvironment: MobileOKXEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
  ];

  it.each(testCases)(
    "$name",
    async ({
      mockEnvironment,
      expectedEnabled,
      expectedVisible,
      expectedProvider,
    }) => {
      const provider = new InAppWalletProvider(
        await mockEnvironment.globalWindow!(),
      );
      provider.init();
      expect(provider.isEnabled()).toBe(expectedEnabled);
      expect(provider.isVisible(mockEnvironment.isMobileDevice)).toBe(
        expectedVisible,
      );
      if (expectedProvider) {
        expect(provider.provider).toBeDefined();
      }
    },
  );
});
