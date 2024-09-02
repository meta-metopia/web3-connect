import {
  DesktopWithMetaMaskEnvironment,
  DesktopWithOKXEnvironment,
  MobileBrowserEnvironment,
  MobileMetaMaskEnvironment,
  MobileOKXEnvironment,
} from "../../test/environments";
import { OKXProvider } from "./okx.provider";

describe("OKX Provider test", () => {
  const testCases = [
    {
      name: "should show OKX provider in desktop browser and not installed",
      mockEnvironment: DesktopWithMetaMaskEnvironment,
      expectedEnabled: false,
      expectedVisible: true,
      expectedProvider: false,
    },
    {
      name: "should show OKX provider in desktop browser and installed",
      mockEnvironment: DesktopWithOKXEnvironment,
      expectedEnabled: true,
      expectedVisible: true,
      expectedProvider: true,
    },
    {
      name: "should not show OKX provider in mobile browser",
      mockEnvironment: MobileBrowserEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should not show OKX provider in Mobile MetaMask",
      mockEnvironment: MobileMetaMaskEnvironment,
      expectedEnabled: false,
      expectedVisible: false,
    },
    {
      name: "should show OKX provider in Mobile OKX wallet",
      mockEnvironment: MobileOKXEnvironment,
      expectedEnabled: true,
      expectedVisible: true,
      expectedProvider: true,
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
      const provider = new OKXProvider(await mockEnvironment.globalWindow!());
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
