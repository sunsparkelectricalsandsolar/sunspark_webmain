import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { CampaignModal } from "@/components/site/campaign-modal";
import { SupportChat } from "@/components/site/support-chat";
import { prisma } from "@/lib/db";
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
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg"
  }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const campaigns = await prisma.campaign.findMany({ where: { isActive: true }, select: { id: true, title: true, description: true, imageUrl: true }, orderBy: { updatedAt: "desc" }, take: 3 }).catch(() => []);
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <CampaignModal campaigns={campaigns} />
        <SupportChat />
      </body>
    </html>
  );
}
