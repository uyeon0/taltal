'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { IS_AIT, VISIT_COOKIE } from '@/shared/config';

// 방문 여부를 3일 보관한다(docs/overview.md "화면 사이의 상태").
// 웹은 쿠키를 쓰고 루트 proxy.web.ts가 서버에서 확인한다. 미니앱은 서버가 없어 앱인토스 Storage에 방문 시각을 쓰고 브라우저에서 확인한다.

const VISIT_MAX_AGE_MS = VISIT_COOKIE.maxAgeSeconds * 1000;

/** SDK는 미니앱에서만 불러온다. 웹 번들에 넣지 않는다 */
const loadStorage = async () => (await import('@apps-in-toss/web-framework')).Storage;

/** 저장한 방문 시각이 보관 기간 안인지 */
export function isRecentVisit(saved: string | null, now: number): boolean {
  const visitedAt = Number(saved);
  if (!saved || !Number.isFinite(visitedAt)) return false;
  return now - visitedAt < VISIT_MAX_AGE_MS;
}

/** 방문을 기록한다. 웹은 쿠키를 쓰고, 미니앱은 Storage에 지금 시각을 쓴다. 다 쓴 뒤에 화면을 옮기도록 기다릴 수 있다 */
export async function markVisited(): Promise<void> {
  if (IS_AIT) {
    await (await loadStorage()).setItem(VISIT_COOKIE.name, String(Date.now()));
    return;
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${VISIT_COOKIE.name}=1; Max-Age=${VISIT_COOKIE.maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

/**
 * 미니앱에서 첫 방문이면 소개로 보낸다. 확인이 끝나 이 화면을 보여도 되면 true다.
 * 웹은 proxy.web.ts가 이미 확인했으므로 바로 true다. Storage를 읽지 못하면 소개로 보내지 않고 화면을 보여 준다.
 */
export function useVisitGate(introHref: string): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(!IS_AIT);

  useEffect(() => {
    if (!IS_AIT) return;
    let active = true;
    loadStorage()
      .then((storage) => storage.getItem(VISIT_COOKIE.name))
      .then(
        (saved) => {
          if (!active) return;
          if (isRecentVisit(saved, Date.now())) setReady(true);
          else router.replace(introHref);
        },
        () => {
          if (active) setReady(true);
        }
      );
    return () => {
      active = false;
    };
  }, [router, introHref]);

  return ready;
}
