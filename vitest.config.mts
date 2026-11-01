import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // server-only는 서버 컴포넌트 환경 밖에서 불러오면 오류를 던진다. 테스트는 서버 코드도 검사하므로 빈 파일로 바꾼다
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
