import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recruiter Follow-Up Desk",
  description: "Daily follow-up desk for recruiter outreach and rebook workflow",
};

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const headline = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-headline",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${body.variable} ${headline.variable} ${mono.variable} min-h-screen bg-surface-0 font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
