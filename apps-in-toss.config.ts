import { defineConfig } from '@apps-in-toss/web-framework/config';

// 앱인토스 미니앱 설정. npm run build:ait가 만든 out/을 번들로 묶는다(docs/specs/apps-in-toss.md)
export default defineConfig({
  // 콘솔에 등록한 이름과 같아야 업로드할 수 있다. API의 CORS 허용 출처(src/_app/api-routes/cors.ts)도 이 이름을 쓴다
  appName: 'taltal',
  brand: {
    // docs/design.md의 brand.primary
    primaryColor: '#F59A4F'
  },
  // File.saveBase64는 권한이 필요하다는 안내가 없다
  permissions: [],
  webBundleDir: 'out'
});
