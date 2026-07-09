import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { NavRail } from "@/components/shell/NavRail";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Roam",
  title: "Roam — AI trip planner",
  description:
    "Tell Roam your dates and vibe. Get a whole day-by-day trip in a minute.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Roam",
  },
};

export const viewport: Viewport = {
  themeColor: "#e7ddc9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${hankenGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-dvh">
          <NavRail />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
