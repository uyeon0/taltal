import Script from 'next/script';
import { CLARITY_PROJECT_ID } from '@/shared/config';

/**
 * 유저 테스트용 Microsoft Clarity 세션 녹화. 프로젝트 ID가 없으면 아무것도 불러오지 않는다.
 * 재료 이름과 양은 가리지 않는다(body의 data-clarity-unmask). 입력칸 값은 Clarity가 늘 가린다.
 */
export function Clarity() {
  if (!CLARITY_PROJECT_ID) return null;

  // Clarity 설치 안내의 태그. 프로젝트 ID는 영문자와 숫자만 들어 있다
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", ${JSON.stringify(CLARITY_PROJECT_ID)});`}
    </Script>
  );
}
