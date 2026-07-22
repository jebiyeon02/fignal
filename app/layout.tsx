import type { Metadata } from "next";
import { FloatingUtilityRail } from "./floating-utility-rail";
import { DEFAULT_PRODUCT_IMAGE } from "./product-image-default";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "./site-config";
import "./globals.css";

const socialImage = `${SITE_URL}${DEFAULT_PRODUCT_IMAGE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: "/images/brand-character-icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/images/brand-character-icon.png",
    apple: "/images/brand-character-icon.png",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [{ url: socialImage, width: 900, height: 900, alt: "FIGNAL BETA 대표 캐릭터 피규어" }],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [socialImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <FloatingUtilityRail />
      </body>
    </html>
  );
}
