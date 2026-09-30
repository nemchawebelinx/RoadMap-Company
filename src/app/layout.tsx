import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebelinxGames – Roadmap",
  description: "Company-level roadmap and workload planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
