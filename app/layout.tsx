import type { Metadata } from "next";
import "./globals.css";
import Chat from "./components/Chat";

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
        <Chat ticker={undefined} />
      </body>
    </html>
  );
}
