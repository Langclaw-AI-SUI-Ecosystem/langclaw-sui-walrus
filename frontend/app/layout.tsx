import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "@mysten/dapp-kit/dist/index.css";
import Web3Provider from "@/lib/Web3Provider";
import { WalletSessionAutoSign } from "@/components/WalletSessionAutoSign";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Langclaw",
  description:
    "Multi-chain Alpha for on-chain intelligence, smart-money monitoring, and verifiable agent decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Web3Provider>
          <TooltipProvider>
            <WalletSessionAutoSign />
            {children}
            <Toaster closeButton position="top-right" richColors />
          </TooltipProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
