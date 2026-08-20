import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

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
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icono-vamo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VAMO",
  },
};

export const viewport: Viewport = {
  themeColor: "#fcf9f8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          href="https://unpkg.com/maplibre-gl@5.18.0/dist/maplibre-gl.css"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fcf9f8] text-[#1c1b1b] selection:bg-[#0056d2] selection:text-white">
        {children}
      </body>
    </html>
  );
}
