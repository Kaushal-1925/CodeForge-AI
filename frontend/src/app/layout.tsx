import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CodeForge AI",
    template: "%s | CodeForge AI",
  },
  description:
    "An autonomous multi-agent software engineering platform for planning, implementing, validating, and testing software projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-foreground antialiased">{children}</body>
    </html>
  );
}
