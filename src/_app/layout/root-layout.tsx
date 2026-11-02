import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BRAND } from '@/shared/assets';
import { SITE } from '@/shared/config';
import { Clarity } from '../analytics/clarity';
import { gumiRomance, suit } from '../fonts';
import { AppProviders } from '../providers/app-providers';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    siteName: SITE.name,
    locale: 'ko_KR',
    type: 'website'
  },
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
          <div className="app-column">
            <AppProviders>{children}</AppProviders>
          </div>
        </div>
        <Clarity />
      </body>
    </html>
  );
}
