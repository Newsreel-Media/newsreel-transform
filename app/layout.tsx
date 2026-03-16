import type { Metadata } from "next"
import { Bree_Serif, DM_Sans, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"

const breeSerif = Bree_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bree-serif",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Newsreel Transform",
  description: "Turn any article into an interactive story",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${breeSerif.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
