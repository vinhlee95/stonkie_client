import type { Metadata } from "next";
import "./globals.css";

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
      </body>
    </html>
  );
}
