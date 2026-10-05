import type { Metadata } from "next";
import "./globals.css";
import "lenis/dist/lenis.css";
import ScrollProvider from "./components/warp-grid/ScrollProvider";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Personal portfolio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body><ScrollProvider>{children}</ScrollProvider></body>
    </html>
  );
}
