"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface EnvironmentContextInterface {
  isMobileDevice: boolean;
  setIsMobileDevice: (isMobile: boolean) => void;
  globalWindow?: Window;
  setGlobalWindow: (window: Window) => void;
  isTest: boolean;
}

export const EnvironmentContext = createContext<EnvironmentContextInterface>(
  {} as any,
);

export function useEnvironment() {
  const {
    isMobileDevice,
    setIsMobileDevice,
    globalWindow,
    setGlobalWindow,
    isTest,
  } = useContext(EnvironmentContext);

  return {
    isMobileDevice,
    setIsMobileDevice,
    setGlobalWindow,
    globalWindow,
    isTest,
  };
}

interface Props {
  children: any;
  isMobile: boolean;
  isTest: boolean;
  defaultWindow?: Window;
}

/**
 * This is the direct context for environment and only exports for tests.
 * Use EnvironmentProvider in app instead.
 * @param children
 * @param isMobile
 * @param isTest
 * @param defaultWindow
 * @constructor
 */
export function EnvironmentContextProvider({
  children,
  isMobile,
  isTest,
  defaultWindow,
}: Props) {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(isMobile);
  const [globalWindow, setGlobalWindow] = useState<Window | undefined>(
    defaultWindow,
  );

  useEffect(() => {
    if (typeof window !== "undefined" && !globalWindow) {
      setGlobalWindow(window);
    }
  }, []);

  const value: EnvironmentContextInterface = {
    isMobileDevice,
    setIsMobileDevice,
    globalWindow,
    setGlobalWindow,
    isTest,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}
