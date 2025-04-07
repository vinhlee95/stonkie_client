import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import BottomNavigation from "./components/BottomNavigation";

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
      <body className="pb-16">
        {children}
        <Suspense>
          <BottomNavigation />
        </Suspense>
      </body>
    </html>
  );
}
