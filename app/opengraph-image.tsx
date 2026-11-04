// 이미지는 src/_app/og-image에서 그린다
export { default, alt, size, contentType } from '@/_app/og-image/og-image';

// 빌드할 때 한 번 그린다. 미니앱 빌드(정적 export)에도 이 설정이 있어야 들어간다
export const dynamic = 'force-static';
