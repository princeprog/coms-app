import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthQueryProvider } from "@/features/auth/components/auth-query-provider";
import { cn } from "@/lib/utils";
import { PwaProvider } from "@/features/pwa/components/pwa-provider";
import { OfflineUpdateGuard } from "@/features/pos-offline/components/offline-update-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  applicationName: "COMS",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "COMS", statusBarStyle: "default" },
  title: "Emma's Chicken House | Staff Login",
  description: "Staff login for Emma's Chicken House.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
};

export const viewport: Viewport = { themeColor: "#c8102e" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable)}
    >
      <body className="antialiased">
        <AuthQueryProvider>
          <ThemeProvider>
            <PwaProvider>
              <OfflineUpdateGuard />
              {children}
              <Toaster />
            </PwaProvider>
          </ThemeProvider>
        </AuthQueryProvider>
      </body>
    </html>
  );
}
