import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 서버 이미지(ImageResponse)용 글꼴. ImageResponse는 woff2와 가변 글꼴의 굵기를 읽지 못해서 공식 OTF를 받은 그대로 둔다.
// 기준은 docs/design.md의 "폰트 파일"이다. 배포에 함께 넣는 설정은 next.config.ts에 있다.

const DIR = join(process.cwd(), 'src/_app/fonts/image');

export type ImageFont = { name: string; data: Buffer; weight: 400 | 500 | 600 | 700; style: 'normal' };

const SUIT_FILES = [
  ['SUIT-Regular.otf', 400],
  ['SUIT-Medium.otf', 500],
  ['SUIT-SemiBold.otf', 600],
  ['SUIT-Bold.otf', 700]
] as const;

let suit: Promise<ImageFont[]> | undefined;
let gumi: Promise<ImageFont[]> | undefined;

/** 본문용 SUIT 네 굵기. 처음 부를 때 한 번 읽는다 */
export function loadSuitFonts(): Promise<ImageFont[]> {
  suit ??= Promise.all(
    SUIT_FILES.map(async ([file, weight]) => ({
      name: 'SUIT',
      data: await readFile(join(DIR, file)),
      weight,
      style: 'normal' as const
    }))
  );
  return suit;
}

/**
 * 서비스 이름 전용 낭만있구미체. SUIT와 한 이미지에 함께 넣으면 SUIT 600이 400으로 그려지고
 * SUIT에 없는 글자("½")가 섞인 단어가 이 글꼴로 바뀐다. 그래서 따로 그린다.
 */
export function loadGumiFont(): Promise<ImageFont[]> {
  gumi ??= readFile(join(DIR, 'GumiRomance-Regular.otf')).then((data) => [
    { name: 'GumiRomance', data, weight: 400, style: 'normal' }
  ]);
  return gumi;
}
