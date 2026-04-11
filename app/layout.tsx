import type { Metadata } from "next";
import { IBM_Plex_Sans, Press_Start_2P } from "next/font/google";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const fontDisplay = Press_Start_2P({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const fontBody = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Chapman BlockPins",
  description: "Drop and save personal map notes around Chapman University.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
