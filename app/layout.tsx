import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthQueryProvider } from "@/features/auth/components/auth-query-provider";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Emma's Chicken House | Staff Login",
  description: "Staff login for Emma's Chicken House.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body className="antialiased">
        <AuthQueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthQueryProvider>
      </body>
    </html>
  );
}
