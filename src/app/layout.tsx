import type { ReactNode } from "react";

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

import { Providers } from "./providers";
import "../styles/globals.css";

const open_sans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zybra Finance",
  description: "A Real-World Asset (RWA) based Liquid Lending Protocol.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={open_sans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
