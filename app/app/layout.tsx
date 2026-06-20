import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "UnifiedMemory — Your Digital Memory OS",
  description: "The first platform that gives AI agents secure, consent-controlled access to your entire digital life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Nav />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
