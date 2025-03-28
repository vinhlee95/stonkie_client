import type { Metadata } from "next";
import "./globals.css";
import Chat from "./components/Chat";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Stonkie 🚀",
  description: "Invest in less is more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense>
          <Chat />
        </Suspense>
      </body>
    </html>
  );
}
