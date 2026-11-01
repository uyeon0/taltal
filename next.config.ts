import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // API가 실행 중에 data/app/의 JSON을 읽으므로 서버 함수에 함께 넣는다
  outputFileTracingIncludes: {
    '/api/**': ['./data/app/**/*']
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
