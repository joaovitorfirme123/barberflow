import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Oswald } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["500", "600", "700"],
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Barberflow",
  description: "Agendamento simples para barbearias.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${oswald.variable} ${jetbrains.variable}`}>
        {children}
      </body>
    </html>
  );
}
