import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyGen — Multi-Agent Work Platform",
  description: "Build AI agents, connect them to tools, compose workflows, and run them anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
