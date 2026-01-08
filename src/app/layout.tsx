import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MenoDAO - Member Portal | Dental Care Dashboard",
    template: "%s | MenoDAO",
  },
  description: "Access your MenoDAO dental care membership. View your dental benefits, make contributions, submit claims, and find dental clinics near you. Affordable dental care for Kenyan families.",
  keywords: [
    "MenoDAO", "Meno DAO", "dental care portal", "dental membership",
    "dental sacco Kenya", "dental benefits", "dental claims",
    "dental care dashboard", "affordable dental care",
    "community dental care", "dental health Kenya",
    "low cost dental treatment", "dental insurance alternative",
  ],
  authors: [{ name: "MenoDAO", url: "https://menodao.org" }],
  creator: "MenoDAO",
  robots: {
    index: false, // Member portal should not be indexed
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://app.menodao.org",
    siteName: "MenoDAO",
    title: "MenoDAO Member Portal",
    description: "Manage your dental care membership, contributions, and claims.",
    images: [{ url: "/logo.png", alt: "MenoDAO" }],
  },
  twitter: {
    card: "summary",
    title: "MenoDAO Member Portal",
    description: "Your dental care membership dashboard",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased bg-gray-50 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
