import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "UnifiedMemory — Your Digital Memory OS",
  description: "The first platform that gives AI agents secure, consent-controlled access to your entire digital life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="no-js" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('um-theme');
                const theme = stored || 'dark';
                document.documentElement.classList.remove('light', 'dark', 'no-js');
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <Nav />
          <main className="relative z-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
