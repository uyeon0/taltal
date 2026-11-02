import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { RecipeImageColors } from '@/widgets/recipe-detail-sheet/index.server';

// 서버 이미지는 CSS 변수를 읽지 못하므로 전역 CSS의 :root 토큰 값을 직접 꺼내 쓴다. 코드에 색 값을 따로 두지 않기 위해서다.
// 배포에 함께 넣는 설정은 next.config.ts에 있다.

const GLOBALS = join(process.cwd(), 'src/_app/styles/globals.css');

/** 이미지 색 → 전역 CSS 토큰 */
const TOKENS: Record<keyof RecipeImageColors, string> = {
  brand: '--primary',
  ink: '--foreground',
  light: '--card',
  subtle: '--border'
};

/** :root 블록에서 토큰 값을 꺼낸다. 토큰이 없으면 오류를 던진다 */
export function readImageColors(css: string): RecipeImageColors {
  const root = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? '';
  const vars = new Map([...root.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
  const color = (token: string) => {
    const value = vars.get(token);
    if (!value) throw new Error(`전역 CSS에 ${token} 토큰이 없다`);
    return value;
  };
  return {
    brand: color(TOKENS.brand),
    ink: color(TOKENS.ink),
    light: color(TOKENS.light),
    subtle: color(TOKENS.subtle)
  };
}

let colors: Promise<RecipeImageColors> | undefined;

/** 처음 부를 때 한 번 읽는다 */
export function loadImageColors(): Promise<RecipeImageColors> {
  colors ??= readFile(GLOBALS, 'utf8')
    .then(readImageColors)
    .catch((error: unknown) => {
      colors = undefined;
      throw error;
    });
  return colors;
}
