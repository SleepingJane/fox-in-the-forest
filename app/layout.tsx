import type { Metadata } from "next";
import { Comfortaa, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

const comfortaa = Comfortaa({
  subsets: ["latin", "cyrillic"],
  variable: "--font-title",
});

export const metadata: Metadata = {
  title: "Лисёнок в лесу",
  description:
    "Короткий браузерный платформер: собери искры, притопчи змей и зажги фонарь на холме.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${nunito.variable} ${comfortaa.variable}`}>{children}</body>
    </html>
  );
}
