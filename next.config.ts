import type { NextConfig } from 'next';

// 미니앱 빌드(앱인토스)면 정적 파일만 만든다. 웹 빌드는 Vercel에서 서버로 실행한다(docs/specs/apps-in-toss.md)
const isAit = process.env.NEXT_PUBLIC_BUILD_TARGET === 'ait';

const nextConfig: NextConfig = {
  ...(isAit
    ? {
        output: 'export',
        // 토스 WebView가 .html 없는 주소를 찾는 방식이 문서에 없어 폴더/index.html 모양으로 만든다
        trailingSlash: true,
        // API 라우트가 빠져 전역 타입 RouteContext가 생기지 않는다. 타입은 npm run typecheck(웹 기준)로 검사한다
        typescript: { ignoreBuildErrors: true }
      }
    : {}),
  // *.web.ts(x)는 웹 빌드에만 들어간다. API 라우트와 proxy처럼 서버가 있어야 동작하는 파일이다
  pageExtensions: isAit ? ['tsx', 'ts'] : ['web.tsx', 'web.ts', 'tsx', 'ts'],
  // API가 실행 중에 data/app/의 JSON을 읽으므로 서버 함수에 함께 넣는다
  outputFileTracingIncludes: {
    '/api/**': ['./data/app/**/*'],
    // 레시피 이미지는 실행 중에 이미지용 글꼴 파일과 색 토큰이 있는 전역 CSS를 읽는다
    '/api/recipes/*/image': ['./src/_app/fonts/image/*', './src/_app/styles/globals.css']
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css'
      }
    }
  }
};

export default nextConfig;
