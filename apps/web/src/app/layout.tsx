import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "../index.css";
import { Newsreader, Manrope, Space_Grotesk } from "next/font/google";

import Header from "@/components/header";
import Providers from "@/components/providers";
import { FloatingSubmitButton } from "@/components/floating-submit-button";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PeerFolio",
  description: "PeerFolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${newsreader.variable} ${manrope.variable} ${spaceGrotesk.variable} antialiased bg-surface text-on-surface`}>
        <ClerkProvider>
          <Providers>
            <div className="grid grid-rows-[auto_1fr] h-svh">
              <Header />
              {children}
            </div>
            <FloatingSubmitButton />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
