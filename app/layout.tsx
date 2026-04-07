import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "le plan | AI Life Manager",
  description: "Plan your day around your energy, not just deadlines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-[#0C0C0C]">
        {children}
      </body>
    </html>
  );
}
