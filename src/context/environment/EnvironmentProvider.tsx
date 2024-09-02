import React from "react";
import { EnvironmentContextProvider } from "./EnvironmentContext";

interface Props {
  children: React.ReactNode;
  isTest?: boolean;
  isMobile?: boolean;
}

/**
 * EnvironmentProvider is a server component that provides the environment context to the application.
 * It checks if the user is on a mobile device and sets the isMobile flag accordingly.
 * @param children
 * @param isTest
 * @param isMobile
 * @constructor
 */
export async function EnvironmentProvider({
  children,
  isTest = false,
  isMobile = false,
}: Props) {
  return (
    <EnvironmentContextProvider isMobile={isMobile} isTest={isTest}>
      {children}
    </EnvironmentContextProvider>
  );
}
