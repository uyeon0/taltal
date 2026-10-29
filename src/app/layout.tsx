import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "장 본 재료 다 쓰기 (가제)",
  description: "가진 재료로 며칠 치 끼니를 짜고, 남는 양까지 계산합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full font-sans antialiased">
      <body className="min-h-full bg-muted">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
