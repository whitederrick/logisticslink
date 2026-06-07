import type { Metadata } from "next";
import { activeService, platform } from "@/lib/product";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: platform.name,
    template: `%s | ${platform.name}`
  },
  description: `${platform.description.en} Current service: ${activeService.name}.`
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
