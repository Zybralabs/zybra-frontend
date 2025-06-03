import type { ReactNode } from "react";
import { Suspense } from 'react';
import LoadingContent from '@/components/LoadingContent';

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { cookieToInitialState } from "@account-kit/core";

import { Providers } from "./providers";
import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Toaster } from "@/components/ui/toaster";
import { headers } from "next/headers";
import { alchemy_config } from "@/config";
import Header from "@/components/Header/Header";
import { Footer } from "@/components";
import { AlertModals } from "@/components/AlertsModals";
import ClientPageTracker from "@/components/ClientPageTracker";

const open_sans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zybra Finance",
  description: "A Real-World Asset (RWA) based Liquid Lending Protocol.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let initialState;
  try {
    const cookieHeader = (await headers()).get("cookie") ?? undefined;
    initialState = cookieToInitialState(alchemy_config, cookieHeader) || initialState;
  } catch (error) {
    console.error("Error computing initial state:", error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={open_sans.className}>
        <Providers initialState={initialState}>
          <div className="flex w-full min-h-screen overflow-x-hidden bg-darkBlue">
            <div className={`flex flex-col flex-1 bg-darkGreen h-full w-full duration-300`}>
              <Suspense fallback={<LoadingContent size="md" />}>
                <Header />
              </Suspense>
              <main className="flex-1 pb-10 mb-10 min-h-[100vh] flex justify-center w-full">
                <Suspense fallback={<LoadingContent size="lg" />}>
                  {children}
                </Suspense>
              </main>
              <Suspense fallback={<LoadingContent size="sm" />}>
                <Footer />
              </Suspense>
            </div>
          </div>
          <AlertModals />
          {/* Add PageTracker to track page visits and mark exploration steps as completed */}
          <ClientPageTracker />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}