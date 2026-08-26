import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://testpilot-qa.eslamgenio.chatgpt.site"),
  title: "TestPilot · QA Mission Control",
  description: "Agent-native QA release mission control powered by WebMCP.",
  applicationName: "TestPilot",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TestPilot · QA Mission Control",
    description: "Agent-native QA release mission control powered by WebMCP.",
    siteName: "TestPilot",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "TestPilot · QA Mission Control",
    description: "Agent-native QA release mission control powered by WebMCP.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
