import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantPilot Portfolio",
  description: "IDX trade journal and portfolio performance tracker",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
