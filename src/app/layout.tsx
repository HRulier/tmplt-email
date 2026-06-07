import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmailGen",
  description: "Générateur de templates email par IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
