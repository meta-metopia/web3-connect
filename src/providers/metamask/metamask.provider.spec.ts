import {
  DesktopWithMetaMaskEnvironment,
  DesktopWithOKXEnvironment,
  MobileBrowserEnvironment,
  MobileMetaMaskEnvironment,
  MobileOKXEnvironment,
} from "../../test/environments";
import { MetaMaskProvider } from "./metamask.provider";

describe("OKX Provider test", () => {
  const testCases = [
    {
      name: "should show MetaMask provider in desktop browser and installed",
      mockEnvironment: DesktopWithMetaMaskEnvironment,
      expectedEnabled: true,
      expectedVisible: true,
      expectedProvider: true,
    },
    {
      name: "should not show MetaMask provider in desktop browser and not installed",
      mockEnvironment: DesktopWithOKXEnvironment,
      expectedEnabled: false,
      expectedVisible: true,
    },
    {
      name: "should not show MetaMask provider in mobile browser",
      mockEnvironment: MobileBrowserEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should not show MetaMask provider in Mobile MetaMask",
      mockEnvironment: MobileMetaMaskEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should not show MetaMask provider in Mobile OKX wallet",
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
      const provider = new MetaMaskProvider(
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
