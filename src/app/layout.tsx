import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  weight: "400",
  variable: "--font-ubuntu",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentinell",
  description: "Review your code with AI",
  icons: {
    icon: "/favicon.svg",
  },
};

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ubuntu.className} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
