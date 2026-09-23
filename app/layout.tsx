import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controle do Bar",
  description: "Vendas por mesa, estoque e resultados por período.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
