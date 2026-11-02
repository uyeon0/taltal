import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BRAND } from '@/shared/assets';
import { SITE } from '@/shared/config';
import { Clarity } from '../analytics/clarity';
import { gumiRomance, suit } from '../fonts';
import { AppProviders } from '../providers/app-providers';
import '../styles/globals.css';

export const metadata: Metadata = {
  // 공유 미리보기 이미지의 주소를 절대 주소로 만든다
  metadataBase: SITE.url ? new URL(`https://${SITE.url}`) : undefined,
  // 화면이 제목을 정하면 "화면 제목 · 탈탈"이 되고, 정하지 않은 시작 홈은 서비스 이름만 쓴다
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    siteName: SITE.name,
    locale: 'ko_KR',
    type: 'website'
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: BRAND.favicon,
    apple: BRAND.appleIcon
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${suit.variable} ${gumiRomance.variable}`}>
      {/* 재료 이름과 양은 개인정보가 아니라서 녹화에서 가리지 않는다(docs/requirements/foundation.md "사용 기록").
          바텀시트는 body 아래 포털로 그려지므로 앱 열이 아니라 body에 단다 */}
      <body data-clarity-unmask="true">
        <div className="app-frame">
          <div className="app-column surface-brand">
            <AppProviders>{children}</AppProviders>
          </div>
        </div>
        <Clarity />
      </body>
    </html>
  );
}
