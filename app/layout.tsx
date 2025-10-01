export const metadata = {
  title: "Drömlyktan",
  description: "Skapa kvällens saga – personliga godnattsagor",
  manifest: "/manifest.json",
  themeColor: "#c8b5ff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drömlyktan",
  },
};

import "./globals.css";
import { Inter, Nunito } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-heading", weight: ["600", "700", "800"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Drömlyktan" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} ${nunito.variable}`}>{children}</body>
    </html>
  );
}


