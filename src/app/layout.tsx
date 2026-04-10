import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI News Hub",
  description: "AI新闻热点聚合",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-100 dark:bg-[#0a0f1a] text-gray-900 dark:text-gray-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
