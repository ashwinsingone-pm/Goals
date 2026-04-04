import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuikScale - Business Operating System",
  description:
    "Production-grade SaaS for running growth-stage companies using Scaling Up methodology",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
