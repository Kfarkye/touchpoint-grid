import type { Metadata } from "next";
import { BOARD_PAGE_DESCRIPTION, BOARD_PAGE_TITLE } from "@/lib/payload-contract";
import "./globals.css";

export const metadata: Metadata = {
  title: BOARD_PAGE_TITLE,
  description: BOARD_PAGE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* SF Pro fallback — system font stack handles Apple devices natively */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface-0 font-sans">{children}</body>
    </html>
  );
}
