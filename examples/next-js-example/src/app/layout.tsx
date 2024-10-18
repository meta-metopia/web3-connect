import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { EnvironmentProvider } from "web3-connect-react";

const Providers = dynamic(
  () => import("@/app/providers").then((mod) => mod.Providers),
  { ssr: false },
);

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Web3-connect-react example",
  description: "Example of using web3-connect-react",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EnvironmentProvider isMobile={false}>
          <Providers>{children}</Providers>
        </EnvironmentProvider>
      </body>
    </html>
  );
}
