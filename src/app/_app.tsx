"use client";
import { Analytics } from "@vercel/analytics/react";
import type { AppProps } from "next/app";
// import "@rainbow-me/rainbowkit/styles.css";

import RootLayout from "./layout";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RootLayout>
      <Component {...pageProps} />
      <Analytics />
    </RootLayout>
  );
}

export default MyApp;
