import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
