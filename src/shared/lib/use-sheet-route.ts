'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { SHEET_PARAM } from '@/shared/config/sheet';

/** 시트를 연 버튼에 단다. 버튼이 다시 그려져도 같은 값의 버튼으로 포커스를 돌려준다 */
export const SHEET_OPENER_ATTR = 'data-sheet-opener';
/** 시트를 연 버튼을 찾지 못하면 이 속성이 달린 뒤로가기 버튼으로 포커스를 돌려준다 */
export const BACK_BUTTON_ATTR = 'data-back-button';

function urlWithSheet(name: string | null): string {
  const url = new URL(window.location.href);
  if (name === null) url.searchParams.delete(SHEET_PARAM);
  else url.searchParams.set(SHEET_PARAM, name);
  return `${url.pathname}${url.search}${url.hash}`;
}

function sheetInUrl(): string | null {
  return new URL(window.location.href).searchParams.get(SHEET_PARAM);
}

function findFocusTarget(opener: HTMLElement | null, openerKey: string | null): HTMLElement | null {
  if (opener?.isConnected) return opener;
  if (openerKey) {
    const sameMeaning = document.querySelector<HTMLElement>(`[${SHEET_OPENER_ATTR}="${CSS.escape(openerKey)}"]`);
    if (sameMeaning) return sameMeaning;
  }
  return document.querySelector<HTMLElement>(`[${BACK_BUTTON_ATTR}]`);
}

/**
 * 주소 쿼리 ?sheet=<name>으로 시트를 연다. 그래서 브라우저 뒤로가기가 시트를 닫는다.
 * 닫히면 포커스를 연 버튼으로, 본문 스크롤을 열기 전 위치로 돌려준다.
 */
export function useSheetRoute(name: string) {
  const searchParams = useSearchParams();
  const open = searchParams.get(SHEET_PARAM) === name;

  // 이 훅이 기록을 더했는지. 주소로 바로 들어왔으면 앞 기록이 이 앱의 것이 아니므로 뒤로 가지 않는다
  const pushedRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const openerKeyRef = useRef<string | null>(null);
  const scrollYRef = useRef<number | null>(null);
  const wasOpenRef = useRef(open);
  // history.back()은 비동기라 닫히기 전에 다시 누르면 기록을 두 번 되돌린다
  const closingRef = useRef(false);

  const openSheet = useCallback(
    (opener?: HTMLElement | null) => {
      // 렌더된 open 값은 빠르게 두 번 누를 때 아직 바뀌지 않았으므로 주소를 직접 본다
      if (sheetInUrl() === name) return;
      const element = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      openerRef.current = element;
      openerKeyRef.current = element?.closest(`[${SHEET_OPENER_ATTR}]`)?.getAttribute(SHEET_OPENER_ATTR) ?? null;
      scrollYRef.current = window.scrollY;
      pushedRef.current = true;
      window.history.pushState(null, '', urlWithSheet(name));
    },
    [name]
  );

  const closeSheet = useCallback(() => {
    if (!open || closingRef.current) return;
    if (pushedRef.current) {
      closingRef.current = true;
      window.history.back();
    } else {
      window.history.replaceState(null, '', urlWithSheet(null));
    }
  }, [open]);

  // 닫기 버튼, Esc, 뒤로가기 어느 쪽으로 닫혀도 같은 곳으로 돌려준다
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (!wasOpen || open) return;
    closingRef.current = false;

    pushedRef.current = false;
    const scrollY = scrollYRef.current;
    const frame = requestAnimationFrame(() => {
      if (scrollY !== null) window.scrollTo({ top: scrollY });
      findFocusTarget(openerRef.current, openerKeyRef.current)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) closeSheet();
    },
    [closeSheet]
  );

  return { open, openSheet, closeSheet, onOpenChange };
}
