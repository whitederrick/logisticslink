import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForwardLink",
  description: "Co-buying digital forwarding platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
