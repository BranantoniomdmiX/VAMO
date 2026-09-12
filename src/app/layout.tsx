import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { PwaRegister } from "@/components/ui/PwaRegister";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "VAMO — Tú Pides. Nosotros Vamos.",
  description: "Sistema Operativo SaaS para Flotas de Motomandados y Logística Urbana.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-vamo.svg",
    shortcut: "/logo-vamo.svg",
    apple: "/logo-vamo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VAMO",
  },
};


export const viewport: Viewport = {
  themeColor: "#fcf9f8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${quicksand.variable} h-full antialiased font-sans`}>
      <head>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fcf9f8] text-[#1c1b1b] selection:bg-[#0056d2] selection:text-white">
        <PwaRegister />
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}
