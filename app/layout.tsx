import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Sunspark Electrical and Solar",
    template: "%s | Sunspark Electrical and Solar"
  },
  description: "Shop electricals, electronics, and solar products in Nairobi with Sunspark Electrical and Solar.",
  openGraph: {
    title: "Sunspark Electrical and Solar",
    description: "Electricals, electronics, and solar products in Nairobi.",
    url: siteConfig.url,
    siteName: "Sunspark Electrical and Solar",
    images: [{ url: "/logo.jpg", width: 1200, height: 630 }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
