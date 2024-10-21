import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
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

export default function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
    segmentPath: string[];
  }>,
) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <EnvironmentProvider isMobile={false}>
          <Providers>
            <Header />
            <main className="flex-1 flex flex-col">{props.children}</main>
          </Providers>
        </EnvironmentProvider>
      </body>
    </html>
  );
}
