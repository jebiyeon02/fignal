import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingUtilityRail } from "./floating-utility-rail";
import { DEFAULT_PRODUCT_IMAGE } from "./product-image-default";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://figsignal-korea.jeong2hyun02.chatgpt.site";
const socialImage = `${siteUrl}${DEFAULT_PRODUCT_IMAGE}`;
const title = "FIGNAL BETA — 피규어 검증";
const description = "사례 비교, 추가 검토, 사진 보완과 지원 범위를 구분해 피규어 검증의 다음 행동을 안내합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: [{ url: "/images/brand-character-icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/images/brand-character-icon.png",
    apple: "/images/brand-character-icon.png",
  },
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: socialImage, width: 900, height: 900, alt: "FIGNAL BETA 대표 캐릭터 피규어" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <FloatingUtilityRail />
      </body>
    </html>
  );
}
