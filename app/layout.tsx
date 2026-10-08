import type { Metadata, Viewport } from "next";
import { Archivo, DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import ScrollProvider from "./components/warp-grid/ScrollProvider";

const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
const body = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body" });
const label = DM_Mono({ subsets: ["latin"], weight: "400", variable: "--font-label" });

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Personal portfolio.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${label.variable}`}><ScrollProvider>{children}</ScrollProvider></body>
    </html>
  );
}
